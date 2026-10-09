
"""Minimal Gemini investigation agent (Phase 14).

question -> Gemini -> selected tools -> actual tool results
         -> Gemini -> evidence-based answer.

Only the six allowlisted, read-only Phase 12 tools may execute.
"""

import json
import logging
from typing import Any

from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.core.config import settings
from app.tools import TOOLS

log = logging.getLogger(__name__)

MAX_ITERATIONS = 8
MAX_TOOL_LIMIT = 200
MAX_RESULT_CHARS = 60_000

SYSTEM_PROMPT = """
You are the investigation agent for NovaCommerce, an e-commerce business.

Answer business questions using only the available read-only tools for orders,
payments, products, inventory, complaints, and website health metrics.

Rules:
- Base every factual statement on data returned by tools. Never invent facts.
- Choose relevant tools and call multiple tools when necessary.
- Tools return newest records first and support limit/offset paging.
- The data is a snapshot. Use timestamps from returned records when discussing
  today or recent periods. State the dates/times being compared.
- If evidence is insufficient, explain what is missing. Do not guess.
- Distinguish observations from interpretations. Correlation is not proof.
- You can only read data. Never claim to have performed an action.
- Do not reveal internal reasoning. Provide conclusions and supporting evidence.

Final answer: short conclusion first, key supporting observations with figures,
then limitations of the available evidence.
"""

PAGING_SCHEMA = {
    "type": "object",
    "properties": {
        "limit": {
            "type": "integer",
            "minimum": 1,
            "maximum": MAX_TOOL_LIMIT,
            "description": (
                f"Maximum records to return; default 50, "
                f"maximum {MAX_TOOL_LIMIT}."
            ),
        },
        "offset": {
            "type": "integer",
            "minimum": 0,
            "description": "Number of records to skip; default 0.",
        },
    },
    "additionalProperties": False,
}

FUNCTION_DECLARATIONS = [
    types.FunctionDeclaration(
        name=name,
        description=" ".join((fn.__doc__ or "").split()),
        parameters_json_schema=PAGING_SCHEMA,
    )
    for name, fn in TOOLS.items()
]


class AgentConfigError(RuntimeError):
    """Gemini is not configured."""


class AgentLLMError(RuntimeError):
    """Gemini request failed or returned an unusable response."""


class AgentToolError(AgentLLMError):
    """An investigation tool failed unexpectedly."""


def _client() -> genai.Client:
    """Create a Gemini client using existing project configuration."""

    if not settings.llm_api_key or not settings.llm_model:
        raise AgentConfigError(
            "Gemini is not configured. Set LLM_API_KEY and LLM_MODEL "
            "in the project-root .env file, then restart the backend."
        )

    return genai.Client(api_key=settings.llm_api_key)


def _run_tool(name: str, raw_args: Any) -> str:
    """Run one allowlisted tool and serialize its result."""

    if name not in TOOLS:
        return json.dumps({"error": "This tool is not allowlisted."})

    try:
        if isinstance(raw_args, dict):
            args = raw_args
        elif isinstance(raw_args, str):
            args = json.loads(raw_args or "{}")
        else:
            raise ValueError("Arguments must be a JSON object.")

        if not isinstance(args, dict):
            raise ValueError("Arguments must be a JSON object.")

        unexpected = set(args) - {"limit", "offset"}
        if unexpected:
            raise ValueError(
                f"Unsupported arguments: {sorted(unexpected)}"
            )

        kwargs: dict[str, int] = {}

        for key in ("limit", "offset"):
            if key not in args:
                continue

            value = args[key]

            if isinstance(value, bool) or not isinstance(value, int):
                raise ValueError(f"{key} must be an integer.")

            kwargs[key] = value

        if "limit" in kwargs:
            if kwargs["limit"] < 1:
                raise ValueError("limit must be at least 1.")

            kwargs["limit"] = min(kwargs["limit"], MAX_TOOL_LIMIT)

        if "offset" in kwargs and kwargs["offset"] < 0:
            raise ValueError("offset cannot be negative.")

        result = TOOLS[name](**kwargs)

    except (ValueError, TypeError) as exc:
        return json.dumps({
            "error": f"Invalid tool arguments: {exc}"
        })

    try:
        result_text = json.dumps(result, default=str)
    except (TypeError, ValueError) as exc:
        log.exception("Could not serialize result from tool %s", name)
        return json.dumps({
            "error": "Tool result could not be serialized."
        })

    if len(result_text) > MAX_RESULT_CHARS:
        result_text = json.dumps({
            "warning": "Result was truncated. Request fewer records.",
            "partial_json": result_text[:MAX_RESULT_CHARS],
        })

    return result_text


def investigate(question: str) -> dict[str, Any]:
    """Run Gemini function calling and return question, answer and tools_used."""

    if not isinstance(question, str) or not question.strip():
        raise ValueError("Question must not be empty.")

    question = question.strip()
    client = _client()

    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=question)],
        )
    ]

    tools_used: list[str] = []

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        tools=[
            types.Tool(function_declarations=FUNCTION_DECLARATIONS)
        ],
        automatic_function_calling=types.AutomaticFunctionCallingConfig(
            disable=True
        ),
    )

    try:
        for _ in range(MAX_ITERATIONS):
            response = client.models.generate_content(
                model=settings.llm_model,
                contents=contents,
                config=config,
            )

            if not response.candidates:
                raise AgentLLMError(
                    "Gemini returned no response candidates."
                )

            candidate_content = response.candidates[0].content

            if candidate_content is None:
                raise AgentLLMError(
                    "Gemini returned an empty response."
                )

            function_calls = [
                part.function_call
                for part in (candidate_content.parts or [])
                if part.function_call is not None
            ]

            if not function_calls:
                answer = (response.text or "").strip()

                if not answer:
                    raise AgentLLMError(
                        "Gemini returned an empty answer."
                    )

                return {
                    "question": question,
                    "answer": answer,
                    "tools_used": tools_used,
                }

            # Preserve Gemini's function-call turn.
            contents.append(candidate_content)

            # Send all responses for this function-call turn together.
            function_response_parts = []

            for function_call in function_calls:
                name = function_call.name or ""

                if name not in TOOLS:
                    log.warning(
                        "Gemini requested a non-allowlisted tool: %s",
                        name,
                    )
                    tool_result = json.dumps({
                        "error": "This tool is not allowlisted."
                    })
                else:
                    log.info("Agent requested tool: %s", name)

                    try:
                        tool_result = _run_tool(
                            name,
                            function_call.args or {},
                        )
                    except Exception as exc:
                        log.exception(
                            "Investigation tool failed: %s", name
                        )
                        raise AgentToolError(
                            f"Investigation tool '{name}' failed. "
                            "Check database connectivity and tool configuration."
                        ) from exc

                    if name not in tools_used:
                        tools_used.append(name)

                try:
                    parsed_result = json.loads(tool_result)
                except json.JSONDecodeError:
                    parsed_result = {"result": tool_result}

                function_response_parts.append(
                    types.Part.from_function_response(
                        name=name,
                        response={"result": parsed_result},
                    )
                )

            # Gemini's API accepts function responses in a user content turn.
            contents.append(
                types.Content(
                    role="user",
                    parts=function_response_parts,
                )
            )

        # The iteration limit was reached. Ask for a final answer using
        # only the evidence already returned by the tools.
        final_config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                disable=True
            ),
        )

        contents.append(
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(
                        text=(
                            "The investigation iteration limit has been reached. "
                            "Answer now using only the evidence already retrieved. "
                            "Clearly state any missing evidence. Do not claim "
                            "that additional tools were called."
                        )
                    )
                ],
            )
        )

        final_response = client.models.generate_content(
            model=settings.llm_model,
            contents=contents,
            config=final_config,
        )

        answer = (final_response.text or "").strip()

        if not answer:
            raise AgentLLMError(
                "Gemini returned an empty final answer."
            )

        return {
            "question": question,
            "answer": answer,
            "tools_used": tools_used,
        }

    except (AgentConfigError, AgentLLMError):
        raise

    except APIError as exc:
        log.exception("Gemini API request failed")
        raise AgentLLMError(
            f"Gemini request failed ({type(exc).__name__}). "
            "Check the API key, model ID, quota, and provider access."
        ) from exc

    except Exception as exc:
        log.exception("Unexpected investigation error")
        raise AgentLLMError(
            "An unexpected investigation error occurred. "
            "Check the backend logs for details."
        ) from exc

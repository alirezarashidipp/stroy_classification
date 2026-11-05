RUBRIC_VERSION = "1.0"

# Proposed demo rubric, not an official HSBC policy.
RUBRIC = {
    "Story": [
        {"id": "story_user", "name": "User or stakeholder", "description": "Identifies who needs the capability."},
        {"id": "story_capability", "name": "Desired capability", "description": "Requests new or changed behaviour available to a user."},
        {"id": "story_value", "name": "User value", "description": "Explains the outcome or benefit for that user."},
    ],
    "Task": [
        {"id": "task_action", "name": "Specific activity", "description": "Describes a concrete implementation, maintenance, or operational activity."},
        {"id": "task_deliverable", "name": "Concrete deliverable", "description": "Names the artefact or verifiable completion of that activity."},
        {"id": "task_focus", "name": "Execution focus", "description": "Primarily specifies how work is done, rather than a user capability or existing defect."},
    ],
    "Bug": [
        {"id": "bug_existing", "name": "Existing behaviour", "description": "Describes a capability that already exists or is expected to work."},
        {"id": "bug_failure", "name": "Observed failure", "description": "Reports an actual error, regression, or incorrect behaviour."},
        {"id": "bug_expected", "name": "Expected vs actual", "description": "Provides evidence of a difference between intended and observed behaviour."},
    ],
}


def build_output_schema(rubric):
    criterion_schema = {
        "type": "object",
        "properties": {
            "evidence": {"type": ["string", "null"]},
            "score": {"type": "integer", "enum": [0, 1, 2]},
            "explanation": {"type": "string"},
        },
        "required": ["evidence", "score", "explanation"],
        "additionalProperties": False,
    }
    criteria = {}
    for category in rubric.values():
        for criterion in category:
            criteria[criterion["id"]] = criterion_schema

    properties = {
        "criteria": {
            "type": "object",
            "properties": criteria,
            "required": list(criteria),
            "additionalProperties": False,
        },
        "summary": {"type": "string"},
        "missing_information": {"type": "array", "items": {"type": "string"}, "maxItems": 3},
        "needs_review": {"type": "boolean"},
    }
    return {
        "type": "object",
        "properties": properties,
        "required": list(properties),
        "additionalProperties": False,
    }

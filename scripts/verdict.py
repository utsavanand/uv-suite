#!/usr/bin/env python3
"""Flow exec step: combine the review and QA verdicts into one routing choice.
Reads the step's inputs as JSON on stdin, prints one JSON line. No model."""
import json
import sys

inputs = json.load(sys.stdin)
review = inputs.get("review")
qa = inputs.get("qa")
if review == "reject":
    choice, reason = "stop", "review rejected the change"
elif review == "approve" and qa == "pass":
    choice, reason = "ship", "review approved and QA passed"
else:
    choice, reason = "revise", f"review={review}, qa={qa}"
print(json.dumps({"choice": choice, "reason": reason, "outputs": {"review": review, "qa": qa}}))

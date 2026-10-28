"""Summarize Copilot CLI --usage-output-file results without exposing sessions."""

import json
import sys
from pathlib import Path


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python compare_usage.py LABEL=usage.json [LABEL=usage.json ...]")
    print("| Run | Execution model | Input | Output | Cache read | AI credits | API seconds |")
    print("| --- | --- | ---: | ---: | ---: | ---: | ---: |")
    for argument in sys.argv[1:]:
        label, separator, path = argument.partition("=")
        if not separator or not label or not path:
            raise SystemExit("Each argument must be LABEL=usage.json")
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        model = data["currentModel"]
        metrics = data["modelMetrics"][model]["usage"]
        credits = data["totalNanoAiu"] / 1_000_000_000
        seconds = data["totalApiDurationMs"] / 1000
        print(
            f"| {label} | {model} | {metrics['inputTokens']:,} | "
            f"{metrics['outputTokens']:,} | {metrics['cacheReadTokens']:,} | "
            f"{credits:.6f} | {seconds:.3f} |"
        )


if __name__ == "__main__":
    main()

# API Contract

## Assistant (AI Brain)

### POST `/assistant/ask`
Answers user questions using project history (commits, issues, PRs) retrieved via semantic vector search with pgvector and cited using Gemini.

#### Request
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "question": "string (1-1000 characters)"
  }
  ```

#### Response Contract
- **Status**: `200 OK`
- **Body**:
  ```json
  {
    "found": true,
    "answer": "string containing citations like [issue_101]",
    "confidence": "high | medium | none",
    "sources": [
      {
        "id": "string",
        "type": "string",
        "url": "string",
        "snippet": "string",
        "score": 0.85
      }
    ]
  }
  ```

#### Not Found Behavior
When no sufficiently relevant historical chunks are found (similarity below threshold 0.55) or the LLM determines the sources do not answer the question:
```json
{
  "found": false,
  "answer": "I couldn't find this in the project history.",
  "confidence": "none",
  "sources": []
}
```

#### Validation & Error Handling
- **Empty / whitespace query**: Returns `200 OK` with `found: false`, `answer: "Please enter a question."`, `sources: []`, `confidence: "none"`.
- **Query exceeding 1,000 characters**: Returns `422 Unprocessable Entity` with validation detail.
- **Server errors**: Returns `200 OK` with friendly fallback message `found: false`, `answer: "Something went wrong. Please try again."`, `sources: []`, `confidence: "none"`.

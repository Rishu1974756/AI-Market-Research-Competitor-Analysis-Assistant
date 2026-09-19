type ValidationResult = {
  valid: boolean;
  reason: string;
};

const GROQ_MODEL =
  process.env.GROQ_MODEL || "openai/gpt-oss-20b";

async function validateWithGroq(
  value: string,
  field: "product" | "geographic market" | "target user"
): Promise<ValidationResult> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const prompt = `
You are a strict input validator for an AI market research application.

Validate this ${field} entered by the user.

The input must contain meaningful information related to the requested field.

For PRODUCT:
Accept:
- Product ideas
- Companies
- Brands
- Services
- Technologies
- Industries
- Business categories
- Market categories

For GEOGRAPHIC MARKET:
Accept:
- Countries
- Cities
- States/provinces
- Regions
- Continents
- Geographic combinations
- Geographic market descriptions

Examples:
India
United States
USA and Europe
Asia Pacific
India and Southeast Asia
California
Global

For TARGET USER:
Accept:
- Customer groups
- User groups
- Businesses
- Professionals
- Students
- Consumers
- Organizations
- Demographic or industry-based audiences

Examples:
College students
Startup founders
Small businesses
Healthcare professionals
Software developers
Parents
Online shoppers
Enterprise companies
Students in India

Reject:
- Gibberish
- Random characters
- Random numbers
- Keyboard patterns
- Placeholder text
- Meaningless strings
- Text that does not describe the requested field

Examples of invalid input:
abcd
asdfgh
qwerty
randomxyz123
123456789
xjskqwe
@#$%^&*

Important:
- Be intelligent rather than relying on fixed keyword lists.
- Do not reject legitimate short inputs.
- Do not reject legitimate company names, locations, industries, or user groups.
- Use your knowledge and context to determine whether the input is meaningful.
- If the input is ambiguous but could reasonably represent a legitimate value, accept it.

Return ONLY JSON.

Required format:

{
  "valid": true,
  "reason": "Short explanation"
}

or

{
  "valid": false,
  "reason": "Short explanation"
}

User input:
"${value}"
`;

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0,
        max_tokens: 150,
        messages: [
          {
            role: "system",
            content:
              "You are a strict market research input validator. Return only JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Groq validation failed: ${response.status}`
    );
  }

  const data = await response.json();

  const content =
    data?.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error(
      "Groq returned an empty validation response"
    );
  }

  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const result = JSON.parse(cleaned);

    return {
      valid: Boolean(result.valid),
      reason:
        typeof result.reason === "string"
          ? result.reason
          : result.valid
            ? "Input is valid."
            : "Please enter meaningful information.",
    };
  } catch {
    throw new Error(
      "Groq returned an invalid validation response"
    );
  }
}

export async function validateResearchTopic(
  value: string
): Promise<ValidationResult> {
  return validateWithGroq(value, "product");
}

export async function validateGeographicMarket(
  value: string
): Promise<ValidationResult> {
  return validateWithGroq(
    value,
    "geographic market"
  );
}

export async function validateTargetUser(
  value: string
): Promise<ValidationResult> {
  return validateWithGroq(
    value,
    "target user"
  );
}
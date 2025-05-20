import { z } from 'zod';

/**
 * Zod schema for capturing information required to generate
 * a new Konveyor static analysis rule.
 */
export const MigrationRuleInputSchema = z
  .object({
    // --- Core Problem Definition ---
    problemDescription: z
      .string()
      .min(10, 'Provide a meaningful summary of the migration issue or pattern to detect.'),
    sourceTechnology: z
      .string()
      .min(
        1,
        "Specify the source technology, framework, library, API, or configuration pattern (e.g., 'EJB 2.x Entity Beans', 'Spring Boot 1.5', 'java.util.Date usage').",
      ),
    targetTechnology: z
      .string()
      .min(
        1,
        "Specify the recommended target technology, framework, library, API, or pattern (e.g., 'JPA Entities', 'Spring Boot 3.x', 'java.time.LocalDate').",
      ),

    // --- Classification & Effort ---
    migrationCategory: z
      .enum(['mandatory', 'optional', 'potential'], {
        errorMap: () => ({ message: "Category must be 'mandatory', 'optional', or 'potential'." }),
      })
      .describe(
        "Severity: 'mandatory' (must fix), 'optional' (recommended), 'potential' (needs investigation). Corresponds to Konveyor rule category.",
      ),
    estimatedEffort: z
      .number()
      .int()
      .min(0, 'Effort must be a non-negative integer.')
      .describe(
        'Estimated effort points (e.g., 1-10) to address the issue. Corresponds to Konveyor rule effort.',
      ),

    // --- Detection Logic (Input for 'when' block) ---
    detectionPatterns: z
      .array(
        z.object({
          type: z
            .enum(['code', 'config'])
            .describe('The type of code or configuration element to detect.'),
          pattern: z
            .string()
            .min(1, 'Detection pattern cannot be empty.')
            .describe(
              "The specific pattern, name, path, or expression to match (e.g., 'javax.ejb.Stateful', 'com.old.library', '//web-app/servlet/servlet-class', 'artifactId:old-library').",
            ),
          // providerHint helps map to Konveyor providers [1]
          providerHint: z
            .enum(['java', 'go', 'dotnet', 'builtin', 'xml', 'maven'])
            .optional()
            .describe(
              'Optional hint for the Konveyor provider likely needed to implement this detection.',
            ),
        }),
      )
      .min(1, 'At least one detection pattern is required.')
      .describe(
        "Defines how to identify the issue in the codebase. Multiple patterns imply an 'AND' or 'OR' condition might be needed in the final rule.",
      ),

    // --- Guidance & Actions (Input for 'perform' block) ---
    guidance: z
      .string()
      .min(
        20,
        'Provide detailed guidance on how to resolve the issue or perform the migration step.',
      )
      .describe(
        'Explanation of the fix, migration path, or code changes needed. Corresponds to Konveyor rule message.',
      ),
    referenceLinks: z
      .array(
        z.object({
          title: z.string().min(1, 'Link title cannot be empty.'),
          url: z.string().url('Provide a valid URL.'),
        }),
      )
      .optional()
      .describe(
        'Optional list of relevant documentation or resource links. Corresponds to Konveyor rule links.',
      ),

    // --- Metadata (Input for rule labels) ---
    proposedTags: z
      .array(
        z.object({
          key: z
            .string()
            .min(1, "Tag key cannot be empty (e.g., 'technology', 'area', 'target-platform')."),
          // Allow empty values, similar to Konveyor labels [1]
          value: z.string().describe('Tag value (can be empty).'),
        }),
      )
      .optional()
      .describe(
        "Optional key-value tags to categorize the potential new rule, similar to Konveyor labels (e.g., 'konveyor.io/source=eap6', 'technology=ejb').",
      ),
  })
  .describe(
    'Schema defining the necessary information to generate a new Konveyor static analysis rule based on migration requirements.',
  );

// --- Example Usage (for validation demonstration) ---
/*
const exampleInput = {
  problemDescription: "Usage of outdated javax.ejb.Stateful annotation",
  sourceTechnology: "Java EE 6/7 (EJB 3.x)",
  targetTechnology: "Jakarta EE / CDI (e.g., @jakarta.enterprise.context.ApplicationScoped)",
  migrationCategory: "mandatory" as const,
  estimatedEffort: 5,
  detectionPatterns:,
  guidance: "Replace the @javax.ejb.Stateful annotation with an appropriate CDI scope annotation like @ApplicationScoped or @SessionScoped depending on the required bean lifecycle. Ensure bean dependencies are updated to use CDI injection (@Inject).",
  referenceLinks:,
  proposedTags: [
    { key: "konveyor.io/source", value: "eap" },
    { key: "konveyor.io/target", value: "quarkus" },
    { key: "technology", value: "ejb" },
    { key: "pattern", value: "annotation-replacement" }
  ]
};

try {
  MigrationRuleInputSchema.parse(exampleInput);
  console.log("Input is valid!");
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Validation failed:", error.errors);
  } else {
    console.error("An unexpected error occurred:", error);
  }
}
*/

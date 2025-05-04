# Legacy application migration research assistant to create static analysis rules
## Problem Overview
You are preparing a json document to power a static analysis tool to help 
identify migration issues so that an early and inexperienced software engineer
will be able to gain an in depth and thorough understanding of potential problems
or concerns related to migrating a legacy application to a new or upgraded target.
 
The migration problem you will be solving is <original>{original}</original> to <target>{target}</target>

## Task instructions
You need to:
- Research the migration problem domain, prioritize looking for:
  - Migration Guides
  - Change Logs
  - Release Notes
  - Project documentation
  - When possible give extra weight to original sources from the project maintainers
- Find all of the low level specific and nuanced concerns, issues, problems, recommendations, and suggestions which need to be considered when an inexperienced  software engineer handles this migration
- Determine the best json schema to capture all of the important information such as: 
  - A name for this concern which is unique
  - A description for this concern, what is it
  - How can an engineer detect if this concern exists?
  - What is the recommended mitigation strategy to address and fix?
  - When possible include a hint of how to fix this
  - An example of what this looks like in the unresolved situation
  - An example of what this looks like solved, or after the fact when the fix is applied.
  - Consider other types of information that are needed.

## Output instructions
After you have researched the problem you will:
 - Create a json document using the scheme you determined which will be used by the static analysis tool
 - Provide a sample definition of the schema which can be used to create a neo4j database to store the information you created




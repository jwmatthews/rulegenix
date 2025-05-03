# Goal

Generate static source code analysis rules to aid modernization examples with Kantra.

## Rough Idea

### Idea #1

- Read various types of documentation
  - Project documentation
  - Project release notes
  - Project changelog
  - Related website documentation
- Read GitHub Issues
- Read GitHub PRs comments
- Build a knowledge repo

### Idea #2

- Look at 2 versions of a component, identify what has changed between the versions
  - Build a graph of each version of the "public" methods/variables
  - Identify what has changed and/or been removed
    - Beyond just removal of something that was deprecated, how can we detect that the usage of an existing API has changed. Perhaps the call signature is identical but now there is a different expectation? Assume this level of change would need to be driven from other knowledge (issues, release notes, changelog, documentation, comments, etc)
- Find related information from documentation, issues, comments in PRs
- Build a knowledge base to mine for related info to attempt to reason through what considerations need to be held when migrating between versions.

## Concept

1. Read a configuration file which has URLs to documentation for a given target

## Related Resources

- Consulted how Langgraph setup an example [data enrichment agent](https://github.com/langchain-ai/data-enrichment-js)

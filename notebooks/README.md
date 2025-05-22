# Migration Analysis Agent Notebook

This directory contains a Jupyter Notebook (`migration_analysis_agent.ipynb`) that utilizes a LangGraph.js-based research agent to analyze software migration scenarios. The agent searches for relevant documentation online and extracts potential issues, concerns, and steps related to a given migration task (e.g., "Log4J 1.x to 2.x").

## Prerequisites

1.  **Node.js:** Ensure you have Node.js (which includes npm) installed. You can download it from [https://nodejs.org/](https://nodejs.org/).
2.  **JupyterLab or Jupyter Notebook:** The notebook is designed to run in a Jupyter environment. If you don't have it, install JupyterLab:
    ```bash
    pip install jupyterlab
    # or pip install notebook for the classic notebook
    ```
3.  **Project Dependencies:** The notebook relies on dependencies defined in the main `package.json` at the project root. This includes `ijavascript` for the TypeScript kernel.

## Setup

1.  **Clone the Repository:** If you haven't already, clone the entire repository this `notebooks` directory resides in.
2.  **Install Dependencies:** Navigate to the root directory of the repository in your terminal and run:
    ```bash
    npm install
    ```
    This will install all necessary packages, including `ijavascript` and other dependencies used by the agent and notebook. The `ijavascript` kernel should have been registered globally during the initial setup of this project. If you encounter issues with the TypeScript kernel in Jupyter, you might need to manually register it (though `npm install` should handle this via `package.json` scripts if configured, or the initial setup step should have covered it).
3.  **LLM Configuration:**
    *   The agent requires LLM API access. Configuration is managed via a `config.yaml` file.
    *   Copy or create `config.yaml` into the `../data/` directory (relative to this `notebooks` directory, so, `project_root/data/config.yaml`).
    *   A sample structure for `config.yaml` is provided in the notebook itself (Cell 4: Load LLM Configuration). You'll need to fill in your specific LLM provider details and API keys.
    *   **Example `../data/config.yaml` structure:**
        ```yaml
        llm:
          activeProvider: bedrock # or openai, anthropic, google, etc.
          providers:
            bedrock:
              type: bedrock
              region: "us-east-1"
              model: "anthropic.claude-3-sonnet-20240229-v1:0"
            openai:
              type: openai
              model: "gpt-4-turbo-preview"
              apiKey: "YOUR_OPENAI_API_KEY" # Or set OPENAI_API_KEY env var
            # ... other provider configurations
        ```

## Running the Notebook

1.  **Start JupyterLab/Notebook:**
    *   Open your terminal, navigate to the **root directory** of the project (the directory containing `package.json` and the `src`, `notebooks` folders).
    *   Launch JupyterLab:
        ```bash
        jupyter lab
        ```
        Or for the classic Jupyter Notebook:
        ```bash
        jupyter notebook
        ```
2.  **Open the Notebook:**
    *   In the Jupyter interface, navigate into the `notebooks` directory.
    *   Open the `migration_analysis_agent.ipynb` file.
3.  **Select Kernel:**
    *   If prompted, or to confirm, make sure the kernel selected for the notebook is "Javascript (Node.js)" or "ijavascript" (this is the TypeScript kernel).
4.  **Run the Cells:**
    *   You can run the cells one by one (e.g., by selecting a cell and pressing `Shift + Enter`).
    *   **Cell 1 (Imports):** Imports necessary modules.
    *   **Cell 2 (Migration Scenario):** Defines the `migrationScenario` string. You can change this string to analyze different migration paths.
    *   **Cell 3 (Extraction Schema):** Defines the structure of the data the agent should try to extract.
    *   **Cell 4 (LLM Configuration):** Loads the LLM settings from `../data/config.yaml`. Ensure this file is correctly set up before running this cell.
    *   **Cell 5 (Invoke Agent):** This is the main cell that runs the research agent. It will make calls to the configured LLM and perform web searches. Output, including logs and the final extracted information, will appear below this cell.
    *   **Cell 6 (Display Results Info):** A markdown cell indicating where results are shown.

## How to Use

1.  **Modify Migration Scenario:** Change the `migrationScenario` variable in Cell 2 to the migration you want to research (e.g., "AngularJS to Angular 17", "Python 2 to Python 3").
2.  **Ensure `config.yaml` is Valid:** Double-check your `../data/config.yaml` before running the agent invocation cell, especially the active LLM provider and API keys/credentials.
3.  **Execute All Cells:** Run all cells sequentially from the "Kernel" or "Run" menu, or run them individually.
4.  **Review Output:** The agent's findings will be printed in the output of Cell 5. This will be a JSON object containing the extracted migration concerns based on the schema.

## Troubleshooting

*   **Kernel Not Found:** If the "Javascript (Node.js)" or "ijavascript" kernel is not available, ensure `ijavascript` was installed correctly (`npm install` in the root) and successfully registered. You might need to run `npx ijsinstall --install=global` (or `sudo ijsinstall --install=global` as done by the setup worker) from the project root if it wasn't automatically done.
*   **LLM Configuration Errors:** Errors in Cell 4 or 5 often point to issues with `../data/config.yaml`. Verify the path, file content, and API credentials.
*   **Import Errors (`../src/...`):** Ensure you are running JupyterLab/Notebook from the **root directory** of the project.

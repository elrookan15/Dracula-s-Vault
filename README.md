PromptVault Studio is a specialized production environment for AI engineers and creative technologists to manage, iterate, and deploy high-performance prompt templates. It bridges the gap between casual prompting and structured AI systems.

Here is a detailed breakdown of the tool’s current capabilities:

 Core Functionalities
   The Master Vault: A persistent, searchable library of prompt templates categorized by industry segments (Writing, Coding, Agents, Data, etc.). It supports favoriting and "Model Tagging" to track which prompts work best with specific LLMs (GPT-4o, Claude 3.5, etc.).
   Dynamic Variable Engine: The tool automatically scans prompts for `[VARIABLE_NAME]` syntax. It generates a real-time "Execution Drawer" where users can input data into these fields, seeing a live interpolated preview of the final production prompt.
   Architecture Lab (Guided Builder): A structured wizard that guides users through a 7-pass engineering framework:
    1.  Identity: Defining role and expertise.
    2.  Tone: Setting style and jargon density.
    3.  Objective: Defining the core action and KPIs.
    4.  Context: Identifying audience and domain.
    5.  Structure: Mapping the output format.
    6.  Constraints: Establishing guardrails and forbidden patterns.
    7.  Logic: Implementing reasoning frameworks (e.g., Chain-of-Thought).
   Version Branching: Within the Architecture Lab, users can "fork" their prompt design into multiple branches (V1, V2, etc.), allowing for simultaneous refinement of different prompt strategies without losing the original draft.

 Technical Highlights
   Full Portability: Integrated JSON Import/Export allows for full vault backups or sharing libraries across different environments.
   Production-Ready Preview: A syntax-highlighted preview pane shows exactly what the LLM will receive, with distinct visual markers for variable values vs. static template text.
   UI/UX Flow: A high-contrast "GitHub Dark" aesthetic designed for long-duration technical work, featuring Material Symbol iconography and responsive drawer-based interaction.

Would you like me to integrate this description into a new "About" or "System Manual" section within the app? Or should we use this to update the gallery metadata?

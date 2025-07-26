# Catalyst: Your Executive Function Assistant Powered by Gemini

![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)

Catalyst is designed to be your trusted executive function assistant with the aim to help you effortlessly kickstart tasks, break through mental blocks, and boost your efficiency. Leveraging the cutting-edge capabilities of Google's Gemini API, Catalyst provides intuitive, AI-powered functionalities that support neurodivergent individuals in navigating their daily responsibilities and organizing their thoughts. TLDR: It's built to empower you to conquer daily challenges and achieve your goals.

## Table of Contents

- [Project Overview & Features](#project-overview--features)
- [Demo](#demo)
- [Built With](#built-with)
- [Installation](#installation)
- [Contributing](#contributing)
- [To-Do List](#to-do-list)
- [License](#license)

## Project Overview & Features

Catalyst is a web application that transforms how you approach complex tasks and manage information. It acts as a bridge between your needs and Gemini's advanced natural language understanding and generation, delivering structured, actionable insights that enhance your organization, focus, and overall productivity.

Catalyst currently offers the following features:

- **General Assistant:** Your go-to tool for quick questions and general support. Whether you need to draft a quick email, understand a concept, or just need a starting point for a thought, the General Assistant provides clear, helpful, and empathetic responses tailored to support neurodivergent ways of thinking.

- **Task Breakdown:** Simply input an overwhelming task, and Catalyst instantly breaks it down into small, manageable, step-by-step instructions. It even provides realistic time estimates to help you plan effectively.

- **Tone Analysis:** Concerned about how your written communication might land? Use the Tone Analysis feature to analyse the tone of your emails or messages. Catalyst helps you understand how your words are perceived and offers suggestions for clearer, more impactful communication.

- **Formalizer (Text Rephrasing & Style Adjustment):** Need to adjust the style of your writing? The Formalizer allows you to rephrase text based on your desired formality — whether you need it casual, professional, or highly formal.

- **Meal Muse (Recipe Suggestion):** Make the most of your kitchen! Simply input a list of ingredients you have on hand, and Catalyst will suggest creative and delicious recipe ideas, helping you reduce food waste and inspire your next meal without a store trip.

- **Brain Dump Organizer:** Turn chaotic thoughts into structured clarity. Dump all your free-form ideas into the Compiler, and Catalyst will organize them into coherent lists, prioritizing actionable items and helping you make sense of your mental landscape.

- **Deep Dive:** Feeling stuck on a complex topic or unfamiliar jargon? The Deep Dive feature acts as your personal explainer. It breaks down difficult concepts into simple, easy-to-understand terms, helping you grasp new information quickly and confidently without getting lost in details.

- **Time Estimator:** Feeling unsure how to fit your tasks into your day? The Time Estimator helps you build a realistic schedule. Provide it with a list of tasks, and it will provide time estimates and help you organize them into a manageable plan. This reduces the mental load of planning and helps you approach your day with confidence.

- **Decision Helper (Coming Soon):** Navigate tricky choices with ease. Present your dilemma, and Catalyst will assist you in clarifying options, outlining benefits and drawbacks, and structuring your decision-making process. Gain the clarity needed to choose confidently and avoid procrastination.

Version 2 will be rebuilt from the ground up to include brand new functionality and the ability to converse back and forth.

Catalyst is built with a secure client-server architecture, ensuring your Gemini API key remains protected on the server-side. The user-friendly frontend is crafted with HTML, CSS, and JavaScript, while the robust backend securely manages communication with the Gemini API.

## Demo

Here is a quick look at the Catalyst user interface:

![Catalyst Screenshot](./assets/img/screenshot.png)

## Built With

This project is built with a combination of modern and robust technologies:

**Frontend:**
*   ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
*   ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
*   ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
*   ![Bootstrap](https://img.shields.io/badge/bootstrap-%238511FA.svg?style=for-the-badge&logo=bootstrap&logoColor=white)

**Backend:**
*   ![PHP](https://img.shields.io/badge/php-%23777BB4.svg?style=for-the-badge&logo=php&logoColor=white)

**API:**
*   Google Gemini

## Installation

Follow these steps to set up the Catalyst project on your local machine. This guide assumes you have a local web server environment like [Laragon](https://laragon.org/), XAMPP, or WAMP installed, which includes PHP.

1.  **Clone the Repository**

    Open your terminal or command prompt, navigate to your web server's root directory (e.g., `c:\laragon\www`), and clone the project:

    ```bash
    git clone https://github.com/johngreenfield/catalyst.git
    cd catalyst
    ```

2.  **Configure Your API Key**

    To use the application, you must provide your own Google Gemini API key. You can obtain a free key from [Google AI Studio](https://aistudio.google.com/).

    - Inside the `api/` directory, copy the file `config.php.example` and rename it to `config.php`.
    - Update the following line in `config.php`, replacing `'YOUR_GEMINI_API_KEY'` with your actual key:

    ```php
    <?php
    // Gemini API Configuration
    define('GEMINI_API_KEY', 'YOUR_GEMINI_API_KEY');
    ```
    **Important:** Ensure that `api/config.php` is listed in your `.gitignore` file to prevent your secret API key from being committed to version control.

3.  **Run the Application**

    - Ensure your local web server (e.g., Apache) is running.
    - Access the project in your web browser. The URL will depend on your local server setup (e.g., `http://catalyst.test` if using Laragon's automatic virtual hosts, or `http://localhost/catalyst`).

You should now be able to use the Catalyst application on your local machine!

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

### Reporting Bugs

If you encounter a bug, please open an issue on GitHub. Be sure to include a clear title, a detailed description of the issue, and steps to reproduce it.

### Suggesting Enhancements

If you have an idea for a new feature or an improvement, please open an issue to discuss it first. This allows us to coordinate efforts and ensure your work aligns with the project's direction.

Thank you for your interest in contributing to Catalyst!

## To-Do List
- [X] Update Help Modal.
- [X] Switch to npm workflow.
- [ ] Fix Clear btn contrast ratio issue.
- [ ] Fix accordion chevron dark theme colour issue.
- [ ] Review Manifest and improve to reach Richer PWA standards.
- [ ] Consider locking down certain features unless own API key is used for the demo.
- [ ] Prompt improvement and testing in AI Studio.
- [ ] Add Troubleshooting section to Readme.

## Version 2
- [ ] Implement the Study Buddy feature.
- [ ] Implement the Playlist Generator feature.
- [ ] Add ability for conversational interaction.
- [ ] Add Notes feature for storing helpful output.
- [ ] Look into brand-aligned names for features.
- [ ] Add localization.
- [ ] Explore potential for multimodal input (e.g., voice input for tasks).
- [ ] Plan for deployment and future scalability.
- [ ] Gather user feedback for iterative improvements.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE.md](LICENSE.md) file for details.
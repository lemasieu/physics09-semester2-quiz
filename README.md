# ⚡ Physics 9 - Semester 2 - Quiz

An interactive web application for practicing multiple-choice questions for **Physics Grade 9 - Semester 2**. Based on the official textbook question bank, it supports customizable quizzes by lesson and difficulty level, featuring a clean, modern, and user-friendly dark interface.

## 🚀 Live Demo

Check out the live demo: [https://www.sieu.io.vn/github/physics09-semester2-quiz](https://www.sieu.io.vn/github/physics09-semester2-quiz)

## ✨ Features

- **Comprehensive Question Bank** – Covers 7 main lessons from Physics 9 - Semester 2
- **Lesson Filter** – Select specific lessons or choose "All Lessons" for a mixed quiz
- **3 Difficulty Levels** – Easy, Medium, Hard – suitable for various skill levels
- **Dynamic Questions** – Some questions include randomized numerical parameters for varied practice
- **Image Support** – Questions with visual illustrations are fully supported
- **Math Formula Rendering** – Integrated with MathJax for beautiful formula display
- **Dark Mode Interface** – Modern dark theme designed to reduce eye strain
- **Instant Feedback** – View correct answers and detailed explanations immediately after each question
- **Spoiler Support** – Detailed derivations and proofs can be expanded/collapsed for better learning
- **Score Tracking** – See your results and performance summary after completing the quiz
- **Responsive Design** – Works seamlessly on desktop, tablet, and mobile devices

## 📚 Lesson List (Semester 2)

| # | Lesson Title |
|---|--------------|
| 1 | Resistance and Ohm's Law |
| 2 | Series and Parallel Circuits |
| 3 | Electrical Energy and Power |
| 4 | Electromagnetic Induction – AC Generation |
| 5 | Effects of Alternating Current |
| 6 | Energy Cycles on Earth – Fossil Fuels |
| 7 | Renewable Energy Sources |

## 📖 Topics Covered

This quiz covers the following key topics from Physics 9 - Semester 2:

- **Electricity:** Resistance, Ohm's law, resistivity, factors affecting resistance
- **Circuits:** Series and parallel circuits, equivalent resistance, voltage and current distribution
- **Power and Energy:** Electrical power, energy consumption, efficiency, energy-saving bulbs
- **Electromagnetism:** Electromagnetic induction, AC generators, transformers
- **AC Effects:** Heating, magnetic, chemical, and physiological effects of alternating current
- **Energy Resources:** Renewable vs non-renewable energy, energy cycles, fossil fuels
- **Sustainability:** Energy conservation, environmental impact, renewable technologies

## 🛠️ Technologies Used

- **HTML5** – Structure of the application
- **Tailwind CSS** – Utility-first CSS framework for styling
- **MathJax** – Math formula rendering
- **JavaScript (ES6+)** – Dynamic logic and data handling
- **JSON** – Question bank data storage

## 📁 Project Structure

```
physics09-semester2-quiz/
├── index.html              # Main entry page
├── data.json               # Question bank
├── script.js               # Core application logic
└── README.md               # Documentation
```

## 🔧 Installation & Usage

1. **Clone the repository**
   ```bash
   git clone https://github.com/lemasieu/physics09-semester2-quiz.git
   ```
2. **Navigate to the project folder**
   ```bash
   cd physics09-semester2-quiz
   ```
   
3. **Run the application with a local server**

⚠️ Important: This project loads data from a JSON file, so you need to use a local development server instead of opening `index.html` directly in your browser to avoid CORS issues.

- **Using VS Code** – Install the "Live Server" extension, right-click on `index.html`, and select "Open with Live Server"
- **Using Python** – Run `python -m http.server` (Python 3) or `python -m SimpleHTTPServer` (Python 2) and open `http://localhost:8000`
- **Using Node.js** – Install `http-server` globally (`npm install -g http-server`) and run `http-server` in the project folder

## 📝 How It Works

1. **Start the quiz** – The app loads the question bank from `data.json`
2. **Customize your quiz** – Select specific lessons and/or difficulty levels
3. **Answer questions** – Choose from the multiple-choice options provided for each question
4. **Receive instant feedback** – Immediately see whether your answer is correct, along with a detailed explanation
5. **Track your progress** – A score summary is displayed after completing the quiz

**Dynamic Questions:**

Some questions include randomized numerical parameters, ensuring that each practice session is slightly different and more engaging.

**Math Formula Rendering:**

All mathematical formulas and expressions are rendered beautifully using MathJax, ensuring clear and professional display.

## 🤝 Contributing

Contributions are welcome! Feel free to submit a Pull Request or open an Issue.
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License
This project is open-source and available under the MIT License.

# AI Ad Maker (ai-sale)

An advanced platform for generating and editing advertising assets. Built with modern web technologies, this application allows users to create marketing materials using generative AI models, remove backgrounds, and manipulate canvas elements.

## Features

- **AI Image Generation**: Generate advertising images using multiple providers (Stability AI, Flux, OpenAI).
- **Background Removal**: Automatically remove backgrounds from product images using `@imgly/background-removal`.
- **Advanced Canvas Editor**: Drag, drop, resize, and edit elements using Fabric.js.
- **AI Text & Content**: Generate ad copy using Google Generative AI (Gemini) and Groq.
- **Modern UI**: Responsive interface built with Tailwind CSS, Shadcn UI, and Base UI.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Shadcn UI
- **State Management:** Zustand
- **Canvas Manipulation:** Fabric.js
- **AI Integrations:**
  - Google Generative AI (Gemini)
  - Fal AI Serverless Client
  - Groq SDK

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- API Keys for the AI services you intend to use (Gemini, Stability, Fal AI, etc.)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Ai-ad-maker.git
   cd Ai-ad-maker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy the example environment file and fill in your API keys:
   ```bash
   cp .env.example .env.local
   ```
   *Note: Never commit your `.env.local` file to version control.*

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## License

This project is open-source and available under the [MIT License](LICENSE).

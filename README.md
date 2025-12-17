# Vite React Project

Modern React application built with Vite, featuring Redux Toolkit, Ant Design, React Query, and comprehensive testing setup.

## 🚀 Features

- ⚡️ **Vite** - Lightning fast build tool
- ⚛️ **React 18** - Latest React features
- 🎨 **Ant Design 5** - Enterprise-class UI design language
- 🔄 **Redux Toolkit** - Efficient state management
- 🔗 **React Router v6** - Client-side routing
- 📝 **React Hook Form + Yup** - Form handling and validation
- 🌍 **i18next** - Internationalization (TR/EN)
- 🎯 **React Query** - Server state management
- 🧪 **Jest + RTL** - Unit testing
- 📱 **TailwindCSS** - Mobile-responsive styling
- 🔒 **JWT Authentication** - Secure authentication
- 📦 **Axios** - HTTP client with interceptors

## 📋 Prerequisites

- Node.js >= 16.0.0
- npm or yarn

## 🛠️ Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/vite-react-project.git
cd vite-react-project
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
yarn install
\`\`\`

3. Copy environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

## 📂 Project Structure

\`\`\`
vite-react-project/
├── public/
│   └── locales/           # Translation files
├── src/
│   ├── assets/            # Static assets
│   ├── components/        # Reusable components
│   ├── constants/         # App constants
│   ├── context/           # React contexts
│   ├── hooks/             # Custom hooks
│   ├── layouts/           # Layout components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── store/             # Redux store
│   ├── translations/      # i18n configuration
│   └── utils/             # Utility functions
\`\`\`

## 🧪 Testing

Run unit tests:
\`\`\`bash
npm run test
\`\`\`

Run tests in watch mode:
\`\`\`bash
npm run test:watch
\`\`\`

Generate coverage report:
\`\`\`bash
npm run test:coverage
\`\`\`

## 🏗️ Build

Build for production:
\`\`\`bash
npm run build
\`\`\`

Preview production build:
\`\`\`bash
npm run preview
\`\`\`

## 🌐 Environment Variables

\`\`\`env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=Vite React Project
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development
\`\`\`

## 🎨 Styling

The project uses both Ant Design components and TailwindCSS for styling:
- Ant Design for complex UI components
- TailwindCSS for utility-first styling and responsive design
- CSS modules for component-specific styles

## 🌍 Internationalization

The app supports multiple languages (TR/EN):
- Language files are located in `/public/locales/`
- Use the language switcher in the header to change languages
- Add new translations by updating the JSON files

## 🔐 Authentication

JWT-based authentication with:
- Access token stored in localStorage
- Refresh token mechanism
- Automatic token refresh on 401 responses
- Protected routes

## 📦 State Management

- **Redux Toolkit** for global state
- **React Query** for server state
- **React Hook Form** for form state

## 🚀 Deployment

The app can be deployed to any static hosting service:

### Vercel
\`\`\`bash
npm i -g vercel
vercel
\`\`\`

### Netlify
\`\`\`bash
npm run build
netlify deploy --dir=dist
\`\`\`

## 📝 License

MIT

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 🆘 Support

For support, email support@example.com or open an issue in the repository.
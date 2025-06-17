# Contributing to Zenlit Social Media App

Thank you for your interest in contributing to Zenlit! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git
- Basic knowledge of React, TypeScript, and Tailwind CSS

### Development Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/zenlit-social.git
   cd zenlit-social
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📋 Development Guidelines

### Code Style
- **TypeScript**: Use strict typing, avoid `any` types
- **React**: Use functional components with hooks
- **Tailwind CSS**: Use utility classes, avoid custom CSS when possible
- **File Naming**: Use PascalCase for components, camelCase for utilities
- **Component Structure**: Keep components small and focused

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components
│   ├── messaging/      # Chat components
│   ├── post/          # Post components
│   ├── profile/       # Profile components
│   ├── radar/         # Radar components
│   ├── social/        # Social verification
│   └── story/         # Story components
├── screens/            # Main app screens
├── data/              # Mock data
├── hooks/             # Custom hooks
├── types/             # TypeScript types
├── utils/             # Utility functions
└── styles/            # Global styles
```

### Component Guidelines
- **Props Interface**: Always define TypeScript interfaces for props
- **Default Props**: Use default parameters instead of defaultProps
- **Event Handlers**: Use descriptive names (handleSubmit, onUserClick)
- **State Management**: Use useState for local state, consider context for shared state
- **Side Effects**: Use useEffect appropriately with proper dependencies

### Example Component Structure
```tsx
import React, { useState } from 'react';

interface Props {
  title: string;
  onAction?: () => void;
  isLoading?: boolean;
}

export const ExampleComponent: React.FC<Props> = ({ 
  title, 
  onAction, 
  isLoading = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h2 className="text-white font-semibold">{title}</h2>
      {/* Component content */}
    </div>
  );
};
```

## 🎯 Contributing Areas

### High Priority
- **Backend Integration** - Replace mock data with real APIs
- **Real OAuth Implementation** - Implement actual social media authentication
- **Database Integration** - Connect to real database
- **Real-time Features** - WebSocket implementation for messaging
- **Testing** - Add comprehensive test coverage

### Medium Priority
- **Performance Optimization** - Improve loading times and animations
- **Accessibility** - Enhance keyboard navigation and screen reader support
- **Error Handling** - Improve error states and user feedback
- **Mobile Optimization** - Fine-tune mobile experience
- **Security** - Implement security best practices

### Low Priority
- **UI Enhancements** - Visual improvements and animations
- **Feature Additions** - New functionality and features
- **Documentation** - Improve code documentation
- **Refactoring** - Code organization improvements

## 🐛 Bug Reports

### Before Submitting
- Check if the issue already exists
- Test on the latest version
- Provide clear reproduction steps

### Bug Report Template
```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- Browser: [e.g. Chrome, Safari]
- Version: [e.g. 22]
- Device: [e.g. iPhone 12, Desktop]
```

## ✨ Feature Requests

### Feature Request Template
```markdown
**Feature Description**
A clear description of the feature.

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Any other context or screenshots.
```

## 🔄 Pull Request Process

### Before Submitting
1. **Create an Issue** - Discuss the change before implementing
2. **Fork and Branch** - Create a feature branch from main
3. **Follow Guidelines** - Adhere to code style and structure
4. **Test Thoroughly** - Ensure your changes work correctly
5. **Update Documentation** - Update relevant documentation

### Pull Request Template
```markdown
**Description**
Brief description of changes.

**Type of Change**
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

**Testing**
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] All tests pass

**Screenshots**
If applicable, add screenshots.

**Checklist**
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

### Review Process
1. **Automated Checks** - Ensure all checks pass
2. **Code Review** - Wait for maintainer review
3. **Address Feedback** - Make requested changes
4. **Final Approval** - Maintainer approves and merges

## 🏗 Architecture Decisions

### State Management
- **Local State**: useState for component-specific state
- **Shared State**: Context API for app-wide state
- **Future**: Consider Redux Toolkit for complex state

### Styling Approach
- **Tailwind CSS**: Primary styling method
- **Component Variants**: Use conditional classes
- **Responsive Design**: Mobile-first approach
- **Dark Theme**: Default and only theme

### Data Flow
- **Props Down**: Pass data down through props
- **Events Up**: Handle events in parent components
- **Mock Data**: Comprehensive mock data system
- **Future**: Replace with real API calls

## 🧪 Testing Guidelines

### Testing Strategy
- **Unit Tests**: Test individual components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user flows
- **Visual Tests**: Test UI consistency

### Testing Tools (Future)
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **Cypress**: End-to-end testing
- **Storybook**: Component documentation

## 📚 Resources

### Learning Resources
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/)

### Design Resources
- [Heroicons](https://heroicons.com/)
- [Tabler Icons](https://tabler-icons.io/)
- [Tailwind UI](https://tailwindui.com/)

## 🤝 Community

### Communication
- **Issues**: Use GitHub issues for bugs and features
- **Discussions**: Use GitHub discussions for questions
- **Code Review**: Provide constructive feedback

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow project guidelines

## 📄 License

By contributing to Zenlit, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Zenlit! Your help makes this project better for everyone. 🚀

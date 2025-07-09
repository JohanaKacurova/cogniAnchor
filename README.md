# Routing Conventions

- All routeable screens in the `app/` directory are re-exports to their actual implementation in the `modules/` directory.
- Example:
  ```tsx
  // app/some-screen.tsx
  export { default } from '../modules/features/some-screen';
  ```
- This keeps routing clear, maintainable, and separates navigation from feature implementation.
- Always follow this pattern for new screens to ensure consistency. 
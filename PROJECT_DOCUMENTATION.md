# Rad5Comms Project Documentation

This document provides a detailed overview of the project structure, including the purpose of each file and folder.

## Root Directory

-   **`eslint.config.js`**: Configuration file for ESLint, a tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.
-   **`index.html`**: The main HTML entry point for the application.
-   **`package.json`**: Contains metadata about the project and a list of its dependencies.
-   **`README.md`**: The main README file for the project.
-   **`tsconfig.app.json`**: TypeScript configuration specific to the application code.
-   **`tsconfig.json`**: The base TypeScript configuration file for the project.
-   **`tsconfig.node.json`**: TypeScript configuration for Node.js-related files, such as the Vite configuration.
-   **`vite.config.ts`**: Configuration file for Vite, the build tool used for this project.
-   **`WEBSOCKET_INTEGRATION.md`**: Documentation specifically for the WebSocket integration.

## `public` Directory

This directory contains static assets that are not processed by the build tool.

-   **`site.webmanifest`**: A web app manifest file that provides information about the application (like its name, author, icon, and description) in a JSON text file.

## `src` Directory

This is the main directory containing the application's source code.

-   **`App.css`**: CSS file for the main `App` component.
-   **`App.tsx`**: The root component of the application. It sets up the main layout and routing.
-   **`index.css`**: Global CSS styles for the application.
-   **`main.tsx`**: The entry point of the React application. It renders the `App` component into the DOM.

### `src/assets`

This directory is intended for static assets like images, fonts, and other media that are imported into the application's components.

### `src/components`

This directory contains all the reusable React components, organized into subdirectories based on their functionality or the part of the UI they represent.

#### `src/components/aside`

Components related to the sidebar of the application.

-   **`Aside.tsx`**: The main container for the sidebar, which includes the header, tabs, and chat sections.
-   **`AsideHeader.tsx`**: The header component of the sidebar, typically containing user information and actions.
-   **`AsideTabs.tsx`**: The tab component within the sidebar, used for switching between different views like chats, calls, etc.
-   **`ChatItem.tsx`**: A component representing a single chat item in the chat list.
-   **`ChatMenuDropdown.tsx`**: A dropdown menu component for a chat item, providing options like delete, archive, etc.
-   **`ChatSearchModal.tsx`**: A modal component for searching chats.
-   **`ChatSection.tsx`**: The section in the sidebar that displays the list of chats.
-   **`CreateChannelModal.tsx`**: A modal for creating a new channel.
-   **`NewConversationModal.tsx`**: A modal for starting a new conversation or direct message.

#### `src/components/common`

Common components that are used across different parts of the application.

-   **`ConfirmModal.tsx`**: A generic modal component to confirm an action.
-   **`ProtectedRoute.tsx`**: A component that wraps routes to protect them from unauthenticated access.

#### `src/components/main`

Components that make up the main chat view area.

-   **`ChatHeader.tsx`**: The header of the main chat view, displaying information about the current chat.
-   **`ChatPlaceholder.tsx`**: A component that is displayed when no chat is selected.
-   **`ForwardModal.tsx`**: A modal for forwarding messages to other chats.
-   **`Main.tsx`**: The main component for the chat area, which combines the chat header, message list, and message input.
-   **`MessageBubble.tsx`**: A component that displays a single message in a chat.
-   **`MessageInput.tsx`**: The input field for typing and sending messages.
-   **`MessageList.tsx`**: The component that displays the list of messages in a chat.

#### `src/components/threadPane`

Components for the thread pane, which typically shows details about the current chat.

-   **`ActionsSection.tsx`**: A section in the thread pane that contains various actions.
-   **`MediaSection.tsx`**: A section that displays media files shared in the chat.
-   **`MemberItem.tsx`**: A component representing a single member in the members list.
-   **`MembersSection.tsx`**: A section that displays the members of the chat.
-   **`ThreadHeader.tsx`**: The header of the thread pane.
-   **`ThreadPane.tsx`**: The main component for the thread pane.

### `src/context`

This directory contains React Context providers for managing global state.

-   **`ThemeContext.tsx`**: Provides theme-related state (e.g., light/dark mode) to the application.
-   **`webSocketContext.tsx`**: Manages the WebSocket connection and provides it to the components that need it.

### `src/hooks`

This directory contains custom React hooks.

-   **`useCall.ts`**: A hook for handling call-related logic.
-   **`useChannel.ts`**: A hook for channel-related logic.
-   **`useDm.ts`**: A hook for direct message-related logic.
-   **`useIsMobile.ts`**: A hook that returns a boolean indicating if the user is on a mobile device.

### `src/pages`

This directory contains the top-level components for each page of the application, which are mapped to routes.

-   **`Auth.tsx`**: The authentication page, which likely includes login and registration forms.
-   **`ForgotPassword.tsx`**: The page for handling the forgot password flow.
-   **`HomePage.tsx`**: The main page of the application that users see after logging in. It contains the main chat interface.
-   **`Settings.tsx`**: The user settings page.

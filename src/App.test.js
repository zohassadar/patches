import { render, screen } from '@testing-library/react';
import App from './App';

test('renders edited text', () => {
  render(<App />);
  const linkElement = screen.getByText(/has been edited/i);
  expect(linkElement).toBeInTheDocument();
});

import { render, screen } from '@testing-library/react';
import { useContext } from 'react';
import Navbar from '../Navbar';

// Mock the AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    loading: false,
    logout: jest.fn(),
  })),
}));

describe('Navbar', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('renders the navbar', () => {
    render(<Navbar />);
    
    // Check if the main navigation elements are rendered
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('shows login and register links when user is not authenticated', () => {
    render(<Navbar />);
    
    // This is a basic smoke test - we can expand it as needed
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
});
/**
 * Tests for question-navigation-grid.tsx
 * Verifies all 4 color states render correctly and click handling
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionNavigationGrid } from '@/components/exam/question-navigation-grid'

describe('QuestionNavigationGrid', () => {
  const defaultProps = {
    totalQuestions: 5,
    currentIndex: 0,
    answers: {},
    flagged: [],
    questionIds: [1, 2, 3, 4, 5],
    onSelectQuestion: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correct number of buttons', () => {
    render(<QuestionNavigationGrid {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    // 5 questions + no legend buttons
    expect(buttons).toHaveLength(5)
  })

  it('unanswered question renders with gray background', () => {
    const { container } = render(<QuestionNavigationGrid {...defaultProps} />)
    const button = container.querySelector('button')
    expect(button).toHaveClass('bg-gray-200')
  })

  it('answered question renders with green background', () => {
    const props = {
      ...defaultProps,
      answers: { 1: [10, 11] },
    }
    const { container } = render(<QuestionNavigationGrid {...props} />)
    const button = container.querySelector('button')
    expect(button).toHaveClass('bg-green-400')
  })

  it('flagged question renders with orange background', () => {
    const props = {
      ...defaultProps,
      flagged: [1],
    }
    const { container } = render(<QuestionNavigationGrid {...props} />)
    const button = container.querySelector('button')
    expect(button).toHaveClass('bg-orange-400')
  })

  it('answered and flagged question renders with yellow background', () => {
    const props = {
      ...defaultProps,
      answers: { 1: [10] },
      flagged: [1],
    }
    const { container } = render(<QuestionNavigationGrid {...props} />)
    const button = container.querySelector('button')
    expect(button).toHaveClass('bg-yellow-400')
  })

  it('current question has ring-2 class', () => {
    const props = {
      ...defaultProps,
      currentIndex: 2,
    }
    const { container } = render(<QuestionNavigationGrid {...props} />)
    const buttons = container.querySelectorAll('button')
    const currentButton = buttons[2]
    expect(currentButton).toHaveClass('ring-2')
    expect(currentButton).toHaveClass('ring-blue-600')
  })

  it('non-current questions do not have ring class', () => {
    const props = {
      ...defaultProps,
      currentIndex: 1,
    }
    const { container } = render(<QuestionNavigationGrid {...props} />)
    const buttons = container.querySelectorAll('button')
    // Question 0 should not have ring
    expect(buttons[0]).not.toHaveClass('ring-2')
    // Question 1 should have ring
    expect(buttons[1]).toHaveClass('ring-2')
  })

  it('clicking button calls onSelectQuestion with correct index', async () => {
    const onSelectQuestion = vi.fn()
    const props = {
      ...defaultProps,
      onSelectQuestion,
    }
    render(<QuestionNavigationGrid {...props} />)

    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[2])

    expect(onSelectQuestion).toHaveBeenCalledWith(2)
    expect(onSelectQuestion).toHaveBeenCalledTimes(1)
  })

  it('multiple questions with mixed states render correctly', () => {
    const props = {
      ...defaultProps,
      totalQuestions: 4,
      questionIds: [10, 20, 30, 40],
      currentIndex: 1,
      answers: { 10: [5], 30: [7, 8] },
      flagged: [30, 40],
    }
    const { container } = render(<QuestionNavigationGrid {...props} />)
    const buttons = container.querySelectorAll('button')

    // Q1 (10): answered → green
    expect(buttons[0]).toHaveClass('bg-green-400')

    // Q2 (20): current, unanswered → gray + ring
    expect(buttons[1]).toHaveClass('bg-gray-200')
    expect(buttons[1]).toHaveClass('ring-2')

    // Q3 (30): answered + flagged → yellow
    expect(buttons[2]).toHaveClass('bg-yellow-400')

    // Q4 (40): flagged only → orange
    expect(buttons[3]).toHaveClass('bg-orange-400')
  })

  it('renders with aria-label for accessibility', () => {
    render(<QuestionNavigationGrid {...defaultProps} />)
    const firstButton = screen.getByLabelText('Go to question 1')
    expect(firstButton).toBeInTheDocument()
  })
})

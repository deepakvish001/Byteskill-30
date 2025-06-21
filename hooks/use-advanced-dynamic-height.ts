"use client"

import { useState, useLayoutEffect, useCallback, type RefObject } from "react"

/**
 * A hook that dynamically tracks the height of a referenced HTMLElement.
 * It uses both ResizeObserver and MutationObserver to provide a highly accurate
 * height value, even when changes are triggered by scroll events (e.g., adding/removing a class)
 * or CSS transitions.
 *
 * @param elementRef - A React ref object pointing to the HTML element to observe.
 * @returns The current height of the element in pixels.
 */
export function useAdvancedDynamicHeight(elementRef: RefObject<HTMLElement>): number {
  const [height, setHeight] = useState(0)

  // useCallback ensures that updateHeight function reference is stable
  const updateHeight = useCallback(() => {
    if (elementRef.current) {
      const newHeight = elementRef.current.getBoundingClientRect().height
      // Only update state if the height has actually changed to prevent unnecessary re-renders
      setHeight((prevHeight) => (newHeight !== prevHeight ? newHeight : prevHeight))
    }
  }, [elementRef])

  useLayoutEffect(() => {
    const element = elementRef.current
    if (!element) {
      return
    }

    // Initial measurement
    updateHeight()

    // Observer for resize events on the element
    const resizeObserver = new ResizeObserver(() => {
      updateHeight()
    })
    resizeObserver.observe(element)

    // Observer for DOM mutations (e.g., class, style changes)
    const mutationObserver = new MutationObserver(() => {
      updateHeight()
    })

    // Observe attributes, child list, and subtree for comprehensive tracking
    mutationObserver.observe(element, {
      attributes: true,
      childList: true,
      subtree: true,
    })

    // Cleanup observers on component unmount
    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [elementRef, updateHeight])

  return height
}

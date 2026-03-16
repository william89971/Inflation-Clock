// Standard animation vocabulary — used across the entire app
// See globals.css for the design token comment block

export const MOTION = {
  // Standard entrance: fade + slide up
  fadeUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" },
  },

  // For whileInView usage
  fadeUpView: {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: "easeOut" },
  },

  // Stagger container
  stagger: {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.1 },
    },
  },

  // Stagger child
  staggerChild: {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  },

  // Interactive feedback
  tap: { scale: 0.97 },
  hoverLift: { y: -2 },
} as const;

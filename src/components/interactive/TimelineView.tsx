"use client";

import { motion } from "framer-motion";

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

interface TimelineViewProps {
  events: TimelineEvent[];
}

export function TimelineView({ events }: TimelineViewProps) {
  return (
    <div className="my-6 relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border sm:left-1/2" />
      {events.map((event, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className={`relative mb-6 pl-10 sm:w-1/2 sm:pl-0 ${
            i % 2 === 0
              ? "sm:pr-8 sm:text-right"
              : "sm:ml-auto sm:pl-8"
          }`}
        >
          <div className="absolute left-2 top-1 h-4 w-4 rounded-full border-2 border-bitcoin bg-surface sm:left-auto sm:right-auto sm:-ml-2 sm:left-1/2"
            style={i % 2 === 0 ? { right: '-8px', left: 'auto' } : { left: '-8px' }} />
          <div className="rounded-xl border border-border bg-surface-card p-4">
            <span className="mb-1 block text-xs font-bold text-bitcoin">
              {event.year}
            </span>
            <h4 className="mb-1 font-medium text-text-primary">{event.title}</h4>
            <p className="text-sm text-text-muted">{event.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

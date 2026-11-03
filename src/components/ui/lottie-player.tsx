// components/ui/lottie-player.tsx
"use client";

import { Lottie } from "lottie-react";

interface Props {
  animationData: object | string; // parsed JSON object, or a URL/path to fetch
  loop?: boolean | number;
  autoplay?: boolean;
  className?: string;
}

export function LottiePlayer({
  animationData,
  loop = true,
  autoplay = true,
  className,
}: Props) {
  return (
    <Lottie
      src={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
    />
  );
}
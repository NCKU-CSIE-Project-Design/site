"use client";

import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';

interface ClarityInitProps {
  clarityId: string;
}

export default function MicrosoftClarity({ clarityId }: ClarityInitProps) {
  useEffect(() => {
    Clarity.init(clarityId);
  }, [clarityId]);

  return null;
} 
import { useMutation } from '@tanstack/react-query';
import translationApi from '../services/translationApi';

export function useNormalize() {
  return useMutation({
    mutationFn: ({ lang, text }: { lang: string; text: string }) =>
      translationApi.normalize(lang, text),
  });
}

export function useSpokenToSigned() {
  return useMutation({
    mutationFn: ({ text, spoken, signed }: { text: string; spoken: string; signed: string }) =>
      translationApi.spokenToSigned(text, spoken, signed),
  });
}

export function useTextToText() {
  return useMutation({
    mutationFn: ({
      direction,
      from,
      to,
      text,
    }: {
      direction: string;
      from: string;
      to: string;
      text: string;
    }) => translationApi.textToText(direction, from, to, text),
  });
}

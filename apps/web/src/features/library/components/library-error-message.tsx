import { Text } from 'pickle-ui/text';

export function LibraryErrorMessage() {
  return (
    <Text tone="destructive">
      Could not reach the API. Start the NestJS server on port 3001.
    </Text>
  );
}

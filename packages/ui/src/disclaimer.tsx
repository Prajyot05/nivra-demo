export function Disclaimer({
  text = "For educational purposes only. Not investment advice. © Nivra Fintech LLC, India",
}: {
  text?: string;
}) {
  return <p className="text-xs text-muted-foreground">{text}</p>;
}

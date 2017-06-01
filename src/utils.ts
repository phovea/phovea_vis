

export function isMissing(v: any) {
  return (v === null || (typeof v === 'number' && isNaN(v)));
}

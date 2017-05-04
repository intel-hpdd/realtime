export default function clone (val) {
  return JSON.parse(JSON.stringify(val));
};

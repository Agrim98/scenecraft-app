import { forward } from "./stories.js";
export const config = { api: { bodyParser: { sizeLimit: "30mb" } } };
export default async function handler(req, res) {
  return forward(req, res, "render", "scenecraft/render");
}

import { Scene } from "./Scene"

declare global {
  interface Window { scene: Scene; }
}
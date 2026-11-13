import { foundFaces } from './openSpot.js';
import './foundFaces.css';

/* Day 3 "We Found N creators" card: a small stack of blurred faces from the
   list instead of one (Julia, Oct 22). Figma 7199:21448 drew one circle for a
   one-creator example. Faces follow the FOUND switch (75 or 7). */
export default function FoundFaces() {
  return (
    <span className="ff-stack" aria-hidden="true">
      {foundFaces().map((src) => (
        <span key={src} className="ff-face"><img src={src} alt="" /></span>
      ))}
    </span>
  );
}

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useLongPress } from "../../hooks/useLongPress";

export function ScrollButtons(){
  const [showTop, setShowTop] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTop(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const upHandlers = useLongPress(
    () => window.scrollTo({ top: 0, behavior: "smooth" }),
    () =>
      window.scrollBy({
        top: -window.innerHeight * 0.8,
        behavior: "smooth",
      })
  );

  const downHandlers = useLongPress(
    () =>
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      }),
    () =>
      window.scrollBy({
        top: window.innerHeight * 0.8,
        behavior: "smooth",
      })
  );

  return (
    <div className="scroll-buttons">
      {showTop && (
        <>
          <button {...upHandlers} aria-label="Scroll to top">
           <ArrowUp size={20} strokeWidth={2.5} />

          </button>
          <div className="divider" />
        </>
      )}

      <button {...downHandlers} aria-label="Scroll to bottom">
        <ArrowDown size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
}
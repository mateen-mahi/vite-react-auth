import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {

  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= 768
  );

  /*
   * Desktop:
   *     OPEN
   *
   * Mobile:
   *     CLOSED
   */
  const [isOpen, setIsOpen] = useState(
    () => window.innerWidth > 768
  );


  useEffect(() => {

    const handleResize = () => {

      const mobile = window.innerWidth <= 768;

      setIsMobile(mobile);

    };


    window.addEventListener(
      "resize",
      handleResize
    );


    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };

  }, []);


  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        setIsOpen,
        isMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}


export function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error(
      "useSidebar must be used inside SidebarProvider"
    );
  }

  return context;
}
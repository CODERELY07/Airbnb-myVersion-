import Image from "next/image";
import Link from "next/link";
import DesktopLogo from "./../../public/Airbnb_Logosvg.png";
import MobileLogo from "./../../public/Airbnb_Logo_mobile.png";
import NavUser from "./NavUser";
import SearchBar from "./SearchBar";

// One header for all screens: the user menu is rendered once,
// and the search bar moves to its own row below lg.
const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="page-container grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 py-3 lg:grid-cols-[1fr_minmax(0,760px)_1fr] lg:py-4">
        <Link href="/" aria-label="Home" className="justify-self-start rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Image src={DesktopLogo} alt="" className="hidden h-auto w-[102px] lg:block" priority />
          <Image src={MobileLogo} alt="" className="block h-auto w-9 lg:hidden" priority />
        </Link>

        <div className="col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <SearchBar />
        </div>

        <div className="col-start-2 row-start-1 justify-self-end lg:col-start-3">
          <NavUser />
        </div>
      </div>
    </header>
  );
};

export default Navbar;

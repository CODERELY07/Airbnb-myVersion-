import Image from "next/image"
import Link from "next/link"
import DesktopLogo from "./../../public/Airbnb_Logosvg.png";
import MobileLogo from "./../../public/Airbnb_Logo_mobile.png";
import NavUser from "./NavUser";
import SearchBar from "./SearchBar";

const Navbar = () => {
  return (
    <div className="w-full border-b">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 p-3 sm:p-5 lg:px-10 container mx-auto">
        <div className="w-full lg:w-auto flex justify-between items-center">
          <Link href="/">
            <Image src={DesktopLogo} alt="Desktop Logo" className="w-24 sm:w-32 hidden lg:block" width={200} height={200} priority/>
            <Image src={MobileLogo} alt="Mobile Logo" className="w-10 sm:w-12 block lg:hidden" width={200} height={200} priority/>
          </Link>
          <div className="lg:hidden">
            <NavUser/>
          </div>
        </div>
        <div className="w-full lg:w-auto lg:flex-1 lg:max-w-3xl">
          <SearchBar/>
        </div>
        <div className="hidden lg:block">
          <NavUser/>
        </div>
      </div>
    </div>
  )
}

export default Navbar
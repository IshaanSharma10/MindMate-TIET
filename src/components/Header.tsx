import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Bell,
  Menu,
  Home,
  MessageCircle,
  BarChart3,
  Heart,
  BookOpen,
  Settings,
  ChevronDown,
  Smile,
  Wind,
  ScanFace,
  LogOut,
  User,
  Sparkles,
} from "lucide-react";
import avatarImage from "@/assets/avatar.png";
import { auth } from "@/FirebaseConfig";
import { signOut } from "firebase/auth";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 font-medium transition-colors ${
      isActive ? "text-primary" : "text-foreground hover:text-primary"
    }`;

  const dropdownItemClass = "flex items-center gap-2 cursor-pointer";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              MindMate
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              {({ isActive }) => (
                <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              )}
            </NavLink>

            <NavLink to="/chat" className={navLinkClass}>
              {({ isActive }) => (
                <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Chat
                </Button>
              )}
            </NavLink>

            {/* Wellness Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Heart className="h-4 w-4" />
                  Wellness
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/mood-tracker")} className={dropdownItemClass}>
                  <Smile className="h-4 w-4 text-yellow-500" />
                  Mood Tracker
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/facial-expression")} className={dropdownItemClass}>
                  <ScanFace className="h-4 w-4 text-blue-500" />
                  Face Recognition
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/breathing")} className={dropdownItemClass}>
                  <Wind className="h-4 w-4 text-cyan-500" />
                  Breathing Exercises
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/wellness")} className={dropdownItemClass}>
                  <Heart className="h-4 w-4 text-red-500" />
                  Wellness Hub
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <NavLink to="/journal" className={navLinkClass}>
              {({ isActive }) => (
                <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Journal
                </Button>
              )}
            </NavLink>

            <NavLink to="/insights" className={navLinkClass}>
              {({ isActive }) => (
                <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Insights
                </Button>
              )}
            </NavLink>
          </nav>

          {/* Right Side - Notifications & Profile */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                2
              </span>
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="h-8 w-8 overflow-hidden rounded-full ring-2 ring-border">
                    <img
                      src={avatarImage}
                      alt="User avatar"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/settings")} className={dropdownItemClass}>
                  <User className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className={dropdownItemClass}>
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className={`${dropdownItemClass} text-red-600`}>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    MindMate
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-6">
                  <NavLink
                    to="/"
                    end
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`
                    }
                  >
                    <Home className="h-5 w-5" />
                    Home
                  </NavLink>

                  <NavLink
                    to="/chat"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`
                    }
                  >
                    <MessageCircle className="h-5 w-5" />
                    Chat with AI
                  </NavLink>

                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Wellness
                  </div>

                  <NavLink
                    to="/mood-tracker"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`
                    }
                  >
                    <Smile className="h-5 w-5 text-yellow-500" />
                    Mood Tracker
                  </NavLink>

                  <NavLink
                    to="/facial-expression"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`
                    }
                  >
                    <ScanFace className="h-5 w-5 text-blue-500" />
                    Face Recognition
                  </NavLink>

                  <NavLink
                    to="/breathing"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`
                    }
                  >
                    <Wind className="h-5 w-5 text-cyan-500" />
                    Breathing Exercises
                  </NavLink>

                  <NavLink
                    to="/wellness"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`
                    }
                  >
                    <Heart className="h-5 w-5 text-red-500" />
                    Wellness Hub
                  </NavLink>

                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Track & Reflect
                  </div>

                  <NavLink
                    to="/journal"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`
                    }
                  >
                    <BookOpen className="h-5 w-5 text-purple-500" />
                    Journal
                  </NavLink>

                  <NavLink
                    to="/insights"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`
                    }
                  >
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    Insights
                  </NavLink>

                  <div className="border-t border-border my-2" />

                  <NavLink
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`
                    }
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </NavLink>

                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-red-50 text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

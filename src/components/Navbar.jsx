export default function Navbar() {
  return (
    <nav className="bg-primary text-white px-6 py-3 flex justify-between items-center shadow-md">
      <h1 className="text-lg font-bold">Payroll System</h1>
      <button className="bg-secondary hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm">
        Logout
      </button>
    </nav>
  );
}

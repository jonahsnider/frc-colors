import AdminNavbarLink from './admin-navbar-links';
import NavbarLink from './navbar-link';
import NavbarLogo from './navbar-logo';

const DEFAULT_NAVBAR_ITEMS = [
	{
		content: 'API Docs',
		href: 'https://github.com/jonahsnider/frc-colors#api-usage',
	},
	{
		content: 'GitHub',
		href: 'https://github.com/jonahsnider/frc-colors',
	},
];

export default function Navbar() {
	return (
		<nav className='w-full text-zinc-100 bg-neutral-800 shadow-lg px-4 py-2 flex justify-center'>
			<div className='self-center flex justify-between w-full max-w-4xl'>
				<NavbarLogo />

				<ul className='flex flex-row gap-x-2'>
					{DEFAULT_NAVBAR_ITEMS.map((item) => (
						<NavbarLink key={item.content} item={item} />
					))}
					<AdminNavbarLink />
				</ul>
			</div>
		</nav>
	);
}

<script>
	import { resolve } from '$app/paths';
</script>

<nav class="navbar is-fixed-top" aria-label="main navigation">
	<div class="navbar-brand">
		<a
			href={resolve('/#')}
			role="button"
			class="navbar-burger"
			aria-label="menu"
			aria-expanded="false"
			data-target="navbarBasicExample"
		>
			<span aria-hidden="true"></span>
			<span aria-hidden="true"></span>
			<span aria-hidden="true"></span>
			<span aria-hidden="true"></span>
		</a>
	</div>

	<div id="placeholder" class="navbar-menu">
		<div class="navbar-start">
			<a href={resolve('/')} class="navbar-item"> Home </a>

			<a href={resolve('/press')} class="navbar-item"> Press and Appearances </a>

			<a href={resolve('/games')} class="navbar-item"> Games </a>

			<a href={resolve('/skills')} class="navbar-item"> Skills </a>

			<a href={resolve('/blog')} class="navbar-item"> Blog </a>

			<a href={resolve('/pinball')} class="navbar-item"> Pinball </a>

			<a href={resolve('/contact')} class="navbar-item"> Contact </a>
		</div>

		<div class="navbar-end">
			<div class="navbar-item"></div>
		</div>
	</div>
</nav>

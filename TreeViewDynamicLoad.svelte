<!-- ⓒ -->
<script context="module">
	const _expansionState = {};
</script>

<script>
	export let tree;
	export let treeNodeClicked;
	export let loading=0;
	export let getSubTree = () => {};

	const label = tree.NAME;
	const children = tree.children;

	let expanded = _expansionState[label] || false;
	const toggleExpansion = (collapse) => {
		if (collapse == true) {
			console.log(label, "Before calling subTree");
			loading = getSubTree(label);
			console.log(label, "After calling subTree");
		}

		expanded = _expansionState[label] = !expanded;
		console.log(expanded, "expand");
	};
	$: arrowDown = expanded;
</script>

{#await loading}
	<p>Loading...</p>
{:then}
	<ul>
		<li>
			{#if children}
				<span
					on:click={() => {
						toggleExpansion(false);
						treeNodeClicked = tree;
					}}
				>
					<span class="arrow" class:arrowDown>&#x25b6</span>
					{#if treeNodeClicked && treeNodeClicked.leaf === "true" && treeNodeClicked.NAME === label}
						{label}
						{#if expanded}
							<div>
								<button
									on:click={() => {
										alert(treeNodeClicked.NAME);
									}}>select</button
								>
							</div>
						{/if}
					{:else}
						{label}
					{/if}
				</span>
				{#if expanded}
					{#each children as child}
						<svelte:self
							
							tree={child}
							getSubTree={(val) => getSubTree(val)}
							bind:treeNodeClicked
							bind:loading
						/>
					{/each}
				{/if}
			{:else}
				<span
					on:click={() => {
						toggleExpansion(true);
						treeNodeClicked = tree;
					}}
				>
					<span class="arrow" />&#x25b6
					{label}
				</span>
			{/if}
		</li>
	</ul>
{/await}

<style>
	ul {
		margin: 0;
		list-style: none;
		padding-left: 1.2rem;
		user-select: none;
	}
	
	.arrow {
		cursor: pointer;
		display: inline-block;
	}
	.arrowDown {
		transform: rotate(90deg);
	}
</style>

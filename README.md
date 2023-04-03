TreeView Dynamic Component: 

This is a dynamic TreeView component that loads data dynamically that is after clicking on the tree node.

``` 
<TreeView
    {tree}
    getSubTree={(val) => getSubTree(val)}
    bind:treeNodeClicked
    />
  ```


Implementation:-

Workflow:-  
1.TreeApp.svelte (the component which populates tree data structure):

•	At first, creating a “tree” object will conclusively represent our tree structure being rendered.

```
 let tree = {
        NAME: "Dogs",
        children: [],
    };
    
```

•	Then, To fill it Dynamically every time on click event on a tree node, a function named “getSubTree” is being defined that fetches data from provided API –“shown_in_code_snippet_below.”  

•	Now, Within function “getSubTree” function named “convertToTreeDataFormat” is called, which converts the fetched data to the required data format for children of a tree that is an array of objects.

```
  async function getSubTree(breed) {
        // condition to set api end-points according breed call.
        let url;
        if (breed == "") {
            url = "https://dog.ceo/api/breeds/list";
        } else {
            url = "https://dog.ceo/api/breed/" + `${breed}` + "/list";
        }
        console.log(url, "URL");
        await fetch(url)
            .then((response) => response.json())
            .then((fetchData) => {
                fetchedData = covertToTreeDataFormat(
                    fetchData.message,
                    fetchData.status
                );
                console.log(fetchedData, "fetchedData");
                if (breed == "") treeData = fetchedData;
                else {
                    insertToTreeData(treeData, fetchedData, breed)
                     console.log(tree, "TREE");
                    console.log(treeData, "NAMES");
                }
                return 1;
            })
            .catch((error) => {
                console.log(error);
                return [];
            });
    }

```
•	Then followed with the conversion of data function “insertToTreeData” is called which inserts the fetched data
Of particular node to its parent’s node using Recursion.

•	Note -> Here, in the above example, the if-condition, which executes only once using “onMount” in svelte, is provided such that there always remains a parent tree structure. In contrast, DOM loads and further fetched data are updated to this structure because if it is not provided, brought data will replace with the parent structure, thus disrupting treeview.

```
function covertToTreeDataFormat(array, status) {
        if (status == "error") return [];
        let treeDataFormat = [];
        for (let i = 0; i < array.length; i++) {
            let tempObject = {};
            tempObject["NAME"] = array[i];
            treeDataFormat[i] = tempObject;
        }
        return treeDataFormat;
    }
```
```
function insertToTreeData(array, fetchedData, breed) {
        if (array.length == 0) return;
        array.forEach((val) => {
            if (val["children"] && val["children"].length > 0) {
                insertToTreeData(val.children, fetchedData, breed);
            }
            if (val.NAME === breed) {
                if (val["children"] && val["children"].length > 0) {
                    let temp = [...val["children"], ...fetchedData];
                    val["leaf"] = fetchedData.length == 0 ? "true" : "false";
                    val["children"] = removeDuplicates(temp);
                } else {
                    val["leaf"] = fetchedData.length == 0 ? "true" : "false";
                    val["children"] = fetchedData;
                }
                return;
            }
        });
    }
```
•	Now, within “insertToTreeData” fetched Node-Data is being inserted to its parent node/with respective parent-child relation.
Function “removeDuplicates” is called to remove duplicity in case it exists.
•	At the end “updateTree” function is defined and called to update the “tree” object that is being rendered with the populated “tree data” variable.

```
function updateTree(tree, treeData) {
  for (let i = 0; i < treeData.length; i++) {
  tree["children"][i] = treeData[i];
   }
}
```
2.TreeViewDynamicLoad.svelte (the component that displays tree structure using recursion):

•	To display TreeView in svelte, “svelte: self” is used to recursively render the nested data structure that is tree structure appropriately.
```
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
```
•	onClick methods are defined to populate tree structure dynamically  .

```
<span
on:click={() => {
toggleExpansion(true);
treeNodeClicked = tree;
}}
>
```
                                                     

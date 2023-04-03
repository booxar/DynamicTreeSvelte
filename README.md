
TreeView Dynamic Component: 

This dynamic TreeView component represents a dynamic tree structure where values(leaves) of the tree are loaded (when present) every time the tree node is clicked. 

Example - Imagine having a list of 100 dog breeds with each dog breed consisting of several sub-breeds & each sub-breed having further classifications and so on. 
Now imagine a user looking for dog breed ‘bulldog’ and further sub-breed as ‘boston bulldog’. In such a case instead of fetching all the data belonging to all the dog breeds via an API call, this dynamic TreeView component only fetches the data for the ‘clicked or selected’ dog breed e.g. bulldog . Same applies when a user wants browse further classifications of the selected sub-breed e.g. ‘boston bulldog’

This dynamic TreeView component makes navigating big tree structures such as above computationally efficient and fast. 


```
TreeView Component that takes input props to render the requested tree view
 
<TreeView
    {tree}
    getSubTree={(val) => getSubTree(val)}
    bind:treeNodeClicked
 />
```

Implementation Details and Workflow steps -


* TreeApp.svelte (the component which populates tree data structure):

At first, creating a “tree” object will conclusively represent our tree structure being rendered.

```
 let tree = {
        NAME: "Dogs",
        children: [],
  };
    
```

1. To load the tree dynamically every time on click event on a tree node, a function named “getSubTree” is being called. It fetches data from provided API.

2. Within function “getSubTree” function named “convertToTreeDataFormat” converts the fetched data to the required data format for children of a tree

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
4. After the conversion the function  “insertToTreeData” inserts fetched data to its parent node using Recursion.

5. Note -> In the above example, the if-condition, which executes only once using “onMount” in svelte, is provided such that there always remains a parent tree structure. This is done to avoid disruption of the tree view when DOM loads;  newly updated data will replace the parent structure thereby disrupting the tree view

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
6. Within “insertToTreeData” fetched node-data is being inserted to its parent node/with respective parent-child relation.
7. Function “removeDuplicates” is called to remove duplicity in case it exists.
8. At the end “updateTree” function is defined and called to update the “tree” object that is being rendered with the populated “tree data” variable.

```
function updateTree(tree, treeData) {
  for (let i = 0; i < treeData.length; i++) {
  tree["children"][i] = treeData[i];
   }
}


```
* TreeViewDynamicLoad.svelte (the component that displays tree structure using recursion):

1. To display TreeView in svelte, “svelte: self” is used to recursively render the nested data structure that is tree structure appropriately.
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
1. onClick methods are defined to populate tree structure dynamically  .

```
<span
on:click={() => {
toggleExpansion(true);
treeNodeClicked = tree;
}}
>
```
                                                     

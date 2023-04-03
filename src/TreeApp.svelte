<script>
    import TreeView from "./TreeViewDynamicLoad.svelte";

    import { onMount } from "svelte";
    let treeData = [];
    let noDuplicatesArray = [];
    let tree = {
        NAME: "Dogs",
        children: [],
    };
    
    let fetchedData;
    let treeNodeClicked;
       
    function updateTree(tree, treeData) {
        for (let i = 0; i < treeData.length; i++) {
            tree["children"][i] = treeData[i];
        }
    }

    $: updateTree(tree, treeData);
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

    onMount(() => {
        getSubTree("");
    });

    function removeDuplicates(array) {
        noDuplicatesArray = array.reduce((finalarray, current) => {
            let obj = finalarray.find((item) => item.ID === current.ID);
            if (obj) return finalarray;
            return finalarray.concat([current]);
        }, []);

        return noDuplicatesArray;
    }

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
    
   
    $: console.log(treeNodeClicked, "treeNodeClicked");
    $: {
        if(treeNodeClicked && treeNodeClicked["NAME"])
         console.log( treeNodeClicked.leaf, "leafNode");
      } 

    
</script>

<TreeView
    {tree}
    getSubTree={(val) => getSubTree(val)}
    bind:treeNodeClicked
    />

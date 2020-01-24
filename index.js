var request = require('request');
var _ = require("underscore")

const apiUrl = "https://seo-interview.herokuapp.com/companies"
const pageLimit = 100

const NAV_TYPE = "nav"
const COMP_TYPE = "company"

let rootNode = {
	type: NAV_TYPE,
	prefix: "/",
	parent: null,
	children: [
	]
}

const addCompanyToRoot = company => {
	const firstLetter = company.charAt(0)
	let letterBucket = _.find(rootNode.children, child => child.prefix === firstLetter)

	if (!letterBucket) {
		// create new bucket
		letterBucket = {
			type: NAV_TYPE,
			prefix: firstLetter,
			parent: rootNode,
			children: [

			]
		}

		rootNode.children.push(letterBucket)
	} 

	letterBucket.children.push({
		type: COMP_TYPE,
		prefix: company,
		parent: letterBucket,
		children: null
	})
}

const organizeCompaniesByFirstLetter = companyNames => {
	_.each(companyNames, company => {
		addCompanyToRoot(company)
	})
}

const organizeChildrenIntoMaxSize = parentNode => {
	console.log("Organizing nodes for " + parentNode.prefix + " with " + parentNode.children.length + " entries")

	const numEntries = parentNode.children.length
	if (numEntries <= pageLimit) return
	// create numBuckets = min

	const numEntriesPerBucket = Math.ceil(numEntries / pageLimit)
	console.log("Each bucket has " + numEntriesPerBucket)
	const batchedEntries = _.chunk(parentNode.children, numEntriesPerBucket)

	// reset the parent node's children
	parentNode.children = []
	// create a new node for each chunk 
	let i = 1
	_.each(batchedEntries, batch => {
		const newNode = {
			type: NAV_TYPE,
			prefix: "-" + i,
			parent: parentNode,
			children: batch
		}

		parentNode.children.push(newNode)
		organizeChildrenIntoMaxSize(newNode)

		i += 1
	})
}

// group companies by first letter
// if the number of companies is greater than limit, bucket
const createTree = (companyNames) => {
	console.log("Creating tree structure") 
	// first organize nodes by first letter
	organizeCompaniesByFirstLetter(companyNames)
	_.each(rootNode.children, letterNode => {
		console.log(letterNode.prefix + ": " + letterNode.children.length)
	})

	// then organize all children correctly for each letter
	_.each(rootNode.children, letterBucket => {
		organizeChildrenIntoMaxSize(letterBucket)
	})

	// write to JSON
	writeTreeToJson(rootNode)
}

// write full tree to JSON file
const writeTreeToJson = tree => {
	console.log("Writing tree to JSON file")
	console.log(tree.children[0].children.length)
	console.log(tree)
}

// fetch companies from https://seo-interview.herokuapp.com/companies
const fetchCompanies = () => {
	request(apiUrl, function (error, response, body) {
	  // console.log('error:', error); // Print the error if one occurred
	  // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
	  // console.log('body:', body); // Print the HTML for the Google homepage.

	  let companyNames = JSON.parse(body).companies
	  companyNames = _.sortBy(companyNames, _.identity)
	  console.log("Got companies: " + companyNames.length)
	  
	  createTree(companyNames)

	});
}

// Start processing
fetchCompanies()


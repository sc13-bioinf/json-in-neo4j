

function JSONInNeo4j (json_object, neo4j_database)
{
	
return function ()
{

	var my = {};
	my["node_modules"] = {};
	my["node_modules"]["util"] = require ("util");
	my["node_modules"]["async"] = require ("async");
	
	my["url"] = null;
	my["server_url"] = null;

	if ( typeof neo4j_database === "string" )
	{
		my["url"] = neo4j_database;
		my["server_url"] = neo4j_database.match("^(http|https):\/\/[a-z\.]+:[0-9]+")[0];
		my["node_modules"]["neo4j"] = require ("neo4j");
		my["neo4j_database"] = new my["node_modules"]["neo4j"].GraphDatabase (my["server_url"]);
	}
	else
	{
		my["neo4j_database"] = neo4j_database;
	}

	my["inspect_call"] = function ()
	{
		var args = Array.prototype.slice.call(arguments);
		var _ = args[args.length -1];
		console.log (["inspect call args: ",args.length].join (""));
		for (var a in args)
		{
			console.log (my["node_modules"]["util"].inspect (args[a]));
		}
		console.log ("end inspect call");
		args.unshift (null);
		_.apply(this,args.slice (0,-1)); 
	};

	my["inject_node"] = function (node)
	{
		return function (_) { _ (null, node); };
	};

	my["swap_node"] = function (node)
	{
		return function (root_node, _) { _ (null, node); };
	};
	
	my["save_node"] = function (node)
	{
		return function (root_node, _)
		{
			console.log ("saving node: "+node);
			var collect = function (err)
			{
				if (err)
				{
					 _ (err);
				}
				else
				{
					_ (null, root_node);
				}
			};
			node.save (collect);
		};
	};
	
	my["from_relation"] = function (to_node, relation, properties)
	{
		return function (from_node, _)
		{
			to_node.createRelationshipFrom (from_node, relation, properties, _);
		};
	};

	my["to_relation"] = function (from_node, relation, properties)
	{
		return function (to_node, _)
		{
			from_node.createRelationshipTo (to_node, relation, properties, _); 
		};
	};

	my["from_node"] = function (relationship, _)
	{
		_ (null, relationship.start);
	};

	my["to_node"] = function (relationship, _)
	{
		_ (null, relationship.end);
	};

	my["typeOf"] = function (value)
	{
		var s = typeof value;
		if (s === "object")
		{
			if (value)
			{
				if (value instanceof Array)
				{
					s = "array";
				}
			}
			else
			{
				s = "null";
			}
		}
		return s;
	};
		
	my["instanceOf"] = function (value)
	{
		if ( value instanceof String )
		{
			return "String";
		}
		else if ( value instanceof Number )
		{
			return "Number";
		}
		else if ( value instanceof Array )
		{
			return "Array";
		}
		else if ( value instanceof Object )
		{
			return "Object";
		}
		else
		{
			return "";
		}
	};

	my["push_json_nodes"] = function (waterfall, json_object)
	{
		var typeof_json_object = my["typeOf"] (json_object);
		var instanceof_json_object = my["instanceOf"] (json_object);

		var json_relation_properties = {
			"typeof": typeof_json_object,
			"instanceof": instanceof_json_object
		};

		console.log ("waterfall size: "+waterfall.length);
		console.log ("json_relation_properties");
		console.log (my["node_modules"]["util"].inspect (json_relation_properties));
		console.log (my["node_modules"]["util"].inspect (json_object));
		console.log ("end of inspect json_object");	
		var json_node_properties = {};

		if ( (typeof_json_object === "string" || typeof_json_object === "number") || (typeof_json_object === "object" && (instanceof_json_object === "String" || instanceof_json_object === "Number" || instanceof_json_object === "") ) )
		{
			json_node_properties["value"] = json_object;
		}

		var json_node = my["neo4j_database"].createNode (json_node_properties); 
		waterfall.push (my["save_node"] (json_node));
		waterfall.push (my["to_relation"] (json_node, "json", json_relation_properties));
		waterfall.push (my["from_node"]);
		//waterfall.push (my["inspect_call"]);

		//recur or return
		if ( instanceof_json_object === "Array" || instanceof_json_object === "Object" )
		{
			var json_object_keys = Object.keys (json_object);
			console.log ("json_object.keys: "+json_object_keys);
			for (var i = 0;i<json_object_keys.length;i++)
			{
				//var v = json_object[k];
				//console.log ("k is: "+k+" v is: "+my["node_modules"]["util"].inspect (v));
				//(function (local_json_object_value)
				//{
					//console.log ("local_json_object_value: "+my["node_modules"]["util"].inspect (local_json_object_value));
					my["push_json_nodes"] (waterfall, json_object[json_object_keys[i]]);
				//}) (v);
			}
		}
	};

	var that = function (parent_or_callback)
	{
		var parent_node = null;
		var callback = parent_or_callback;
		if ( arguments.length > 1 )
		{
			parent_node = parent_or_callback;
			callback = arguments[1];
		}
		//console.log ("json-in-neo4j parent_node: "+my["node_modules"]["util"].inspect (parent_node));
		//console.log ("json-in-neo4j callback: "+my["node_modules"]["util"].inspect (callback));
		var type_of_json_root = my["typeOf"] (json_object);
		if ( type_of_json_root === "object" || type_of_json_root === "array" )
		{
			var json_in_neo4j_waterfall = [my["inject_node"] (parent_node)];

			var json_in_neo4j_root_node_properties = {
				"json-in-neo4j": "0.0.1",
				"created": (new Date()).toISOString ()
			};
			var json_in_neo4j_node = my["neo4j_database"].createNode (json_in_neo4j_root_node_properties);
			json_in_neo4j_waterfall.push (my["save_node"] (json_in_neo4j_node));

			if ( parent_node === null )
			{
				json_in_neo4j_waterfall.push (my["swap_node"] (json_in_neo4j_node));
			}
			else
			{
				json_in_neo4j_waterfall.push (my["to_relation"] (json_in_neo4j_node, "data", {}));
				json_in_neo4j_waterfall.push (my["from_node"]);
			}
		
			console.log ("called that.push_json_nodes with: "+my["node_modules"]["util"].inspect (json_object));	
			my["push_json_nodes"] (json_in_neo4j_waterfall, json_object);
			
			console.log ("json-in-neo4j waterfall: "+json_in_neo4j_waterfall.length);	
			my["node_modules"]["async"].waterfall (json_in_neo4j_waterfall, callback); 
		}
		else
		{
			callback ("Invalid json: root must be array or object you gave '"+type_of_json_root+"'");
		}	
	};
	return that;
} ();
};

module.exports.JSONInNeo4j = JSONInNeo4j;

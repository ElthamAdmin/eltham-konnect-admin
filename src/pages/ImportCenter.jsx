import {useState} from "react"
import axios from "axios"

function ImportCenter(){

const [customerFile,setCustomerFile]=useState(null)
const [rateFile,setRateFile]=useState(null)

const uploadCustomers=async()=>{

if(!customerFile){
alert("Select Excel file")
return
}

const formData=new FormData()
formData.append("file",customerFile)

const res=await axios.post(
"http://localhost:5000/api/import/customers",
formData
)

alert(res.data.message)

}

const uploadRates=async()=>{

if(!rateFile){
alert("Select Excel file")
return
}

const formData=new FormData()
formData.append("file",rateFile)

const res=await axios.post(
"http://localhost:5000/api/import/rates",
formData
)

alert(res.data.message)

}

return(

<div>

<h1>Import Center</h1>

<div style={{background:"white",padding:20,marginBottom:30}}>

<h2>Import Customers</h2>

<input
type="file"
accept=".xlsx"
onChange={(e)=>setCustomerFile(e.target.files[0])}
/>

<br/><br/>

<button onClick={uploadCustomers}>
Upload Customer List
</button>

</div>


<div style={{background:"white",padding:20}}>

<h2>Import Shipping Rates</h2>

<input
type="file"
accept=".xlsx"
onChange={(e)=>setRateFile(e.target.files[0])}
/>

<br/><br/>

<button onClick={uploadRates}>
Upload Rate Sheet
</button>

</div>

</div>

)

}

export default ImportCenter
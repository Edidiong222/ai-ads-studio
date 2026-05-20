const submitBtn = document.getElementById('submitBtn')

submitBtn.addEventListener('click', function (e) {
    e.preventDefault();
    uploadUserData();
    console.log("Hello there again")
})


async function uploadUserData() {


    const username = document.getElementById('username').value
    const firstName = document.getElementById('firstName').value
    const lastName = document.getElementById('lastName').value
    const email = document.getElementById('email').value
    const workEmail = document.getElementById('workEmail').value
    const password = document.getElementById('password').value
    const confirmPassword = document.getElementById('confirmPassword').value





    const newUserData = {
        username: username,
        first_name: firstName,
        last_name: lastName,
        email: email,
        workEmail: workEmail,
        password: password,
        password_confirm: confirmPassword
    };

    try {
        const uploadAndGet = await fetch('https://ai-ads-studio-kappa.vercel.app/api/auth/register/',{
            method: 'POST',
            body: JSON.stringify(newUserData),
            headers: {
                "Content-type": "application/json"
            }
        })

        const data = await uploadAndGet.json()
        console.log(data)
    } catch (error) {
        console.error("Something went wrong",error)
    }
}



const { createApp, ref } = Vue;
const { createClient } = supabase;

createApp({
    setup() {
     
        const supabase = createClient('https://vmjkvqgvtjauoibbcexr.supabase.co', 
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtamt2cWd2dGphdW9pYmJjZXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5ODE3OTAsImV4cCI6MjA0MTU1Nzc5MH0.WL8TLQGqxCLGZLSP4mYRpdC_VGoyO8Z02EXo2Rxn02M');
        
        const show = ref('SignUp');
        const email = ref('jorge@gmail.com');
        const password = ref('123456');
        const user = ref({});
        const users = ref([]);
        const receptor = ref({});
        const message = ref('Escribe tu mensaje aqui');
        const messages = ref([]);
        const subscripcion = ref('')

        const enviar =async ()=>{
            
            if( receptor.value.auth_id !== undefined && message.value !== '' ){
                const {error} = await supabase.from('mensajes').insert({
                    mensaje: message.value,
                    emisor_id:user.value.id,
                    receptor_id:receptor.value.auth_id
                })
                message.value = '';    
                // cargarMensajes();
                // const channels = supabase.channel('public-mensajes').
                // on(
                //     'postgres_changes',
                //     { event: '*',schema:'public',table:'mensajes' },
                //     ( payload ) =>{
                //         console.log('Change received', payload);
                //     }
                // ).subscribe();
            }else{
                showAlert('Campos vacios','REceptor vacio', 'info')

            }
           
        }
        const logIn = async ()=>{
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.value,
                password: password.value,
              })
           
              if(error){
                console.log(error);
              }else{
                user.value = data.user;
                const response = await supabase.from('users').
                        select().
                        eq('auth_id', user.value.id)
                        if(response.error){
                            console.log(response.error);
                        }else{
                            console.log(response.data);
                            user.value.nombres = response.data[0].nombres;
                            user.value.email = response.data[0].username;
                            localStorage.setItem('user', JSON.stringify(user.value));
                            showAlert('Operacion completado','Login con exito', 'success')

                        }
                        listarUsuarios();
              }
        }

        const register = async()=>{
            if( email.value.trim() !== '' && password.value.trim()!=='' ){
                const {data, error} = await supabase.auth.signUp({
                    email:email.value,
                    password:password.value
                })
                if( error ){
                    showAlert('Error al registrar el usuario','Ocurrio un error durante el registro', 'error')
                }else{
                    user.value = data.user;

                    const { error } = await supabase
                                        .from('users')
                                        .insert({ 
                                            nombres:'Jorge Ocampo',
                                            username:'jorgeocampo',
                                            email:email.value,
                                            auth_id:user.value.id
                                         })

                    console.log(error);        
                    user.value.nombres = 'jorge ocampo'
                    user.value.email = 'jorgeocampo'             
                    localStorage.setItem('user',JSON.stringify(user.value));
                    showAlert('Registro completado','El usuario se registro con exito', 'success')
                }
            }else{
                showAlert('Formulario incompleto','Los campos email/password no deben estar vacios', 'info')
            }
        }


        const listarUsuarios = async()=>{
            const { data, error } = await supabase
                .from('users')
                .select();

                if(error){
                    console.log(error);
                }else{
                    console.log(data);
                    users.value = data;
                }
        }
        const seleccionarReceptor = async (item)=>{
            receptor.value = item;
            cargarMensajes();
            // setInterval(() => {
            //     cargarMensajes();
            // }, 3000);
            // receptor.value = item;
            // const { data, error } = await supabase
            //     .from('mensajes')
            //     .select();

            //     if(error){
            //         console.log(error);
            //     }else{
            //         console.log(data);
            //         messages.value = data;
            //     }
            //     console.log(messages.value);
            subscripcion.value = supabase.channel('mensajes').
            on('postgres_changes',{ event: 'INSERT', schema:'public', table:'mensajes', filter:'receptor_id=eq.'+user.value.id+',emisor_id=eq.'+ receptor.value.auth_id }, payload =>{
                messages.value.push(payload.new);
                if( payload.new.receptor_id == user.value.id ){
                    var audio = document.getElementById('audio');
                    audio.play();
                }
            }).subscribe();
        }        
        
        const cargarMensajes = async () => {
            const { data, error } = await supabase
              .from('mensajes')
              .select()
              .or(`and(emisor_id.eq.${user.value.id},receptor_id.eq.${receptor.value.auth_id}),and(emisor_id.eq.${receptor.value.auth_id},receptor_id.eq.${user.value.id})`)
              .order('id', { ascending: false }) 
              .limit(10);
          
            if (error) {
              console.log(error);
            } else {
              console.log(data);
              messages.value = data.reverse();
            }
            
          };
          
        
        function showAlert(title, message, tipo){
            Swal.fire({
                title: title,
                text: message,
                icon: tipo
              });
        }
        return {
            show,
            email,
            password,
            register,
            user,
            users,
            seleccionarReceptor,
            receptor,
            message,
            messages,
            logIn,
            enviar,
        }
    }
}).mount('#app')

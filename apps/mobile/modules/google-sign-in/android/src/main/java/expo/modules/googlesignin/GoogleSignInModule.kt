package expo.modules.googlesignin

import android.app.Activity
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class GoogleSignInModule : Module() {
    private var signInClient: GoogleSignInClient? = null
    private var pendingSignInPromise: Promise? = null

    override fun definition() = ModuleDefinition {
        Name("GoogleSignIn")

        AsyncFunction("configure") { webClientId: String ->
            val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(webClientId)
                .requestEmail()
                .build()

            signInClient = GoogleSignIn.getClient(appContext.reactContext!!, gso)
        }

        AsyncFunction("signIn") { promise: Promise ->
            val client = signInClient
            if (client == null) {
                promise.reject("E_NOT_CONFIGURED", "GoogleSignIn not configured. Call configure() first.", null)
                return@AsyncFunction
            }

            val activity = appContext.currentActivity
            if (activity == null) {
                promise.reject("E_NO_ACTIVITY", "No activity available", null)
                return@AsyncFunction
            }

            pendingSignInPromise = promise
            val intent = client.signInIntent
            activity.startActivityForResult(intent, RC_SIGN_IN)
        }

        OnActivityResult { _: Activity, result ->
            if (result.requestCode != RC_SIGN_IN) return@OnActivityResult
            
            val promise = pendingSignInPromise
            pendingSignInPromise = null
            if (promise == null) return@OnActivityResult

            val intent = result.data
            if (intent == null) {
                promise.reject("E_NO_DATA", "No data in activity result", null)
                return@OnActivityResult
            }

            val task = GoogleSignIn.getSignedInAccountFromIntent(intent)
            task.addOnSuccessListener { account ->
                val resultMap = mapOf(
                    "idToken" to (account.idToken ?: ""),
                    "accessToken" to (account.serverAuthCode ?: ""),
                    "email" to (account.email ?: ""),
                    "displayName" to (account.displayName ?: ""),
                    "id" to (account.id ?: "")
                )
                promise.resolve(resultMap)
            }
            task.addOnFailureListener { e ->
                val errorCode: String
                val errorMessage: String
                if (e is ApiException) {
                    errorCode = when (e.statusCode) {
                        12501 -> "E_SIGN_IN_CANCELLED"
                        else -> "E_SIGN_IN_FAILED"
                    }
                    errorMessage = e.message ?: "Unknown error"
                } else {
                    errorCode = "E_SIGN_IN_FAILED"
                    errorMessage = e.message ?: "Unknown error"
                }
                promise.reject(errorCode, errorMessage, null)
            }
        }

        AsyncFunction("signOut") { promise: Promise ->
            val client = signInClient
            if (client == null) {
                promise.reject("E_NOT_CONFIGURED", "GoogleSignIn not configured", null)
                return@AsyncFunction
            }

            client.signOut()
                .addOnSuccessListener {
                    promise.resolve(null)
                }
                .addOnFailureListener { e ->
                    promise.reject("E_SIGN_OUT", e.message ?: "Sign out failed", null)
                }
        }

        AsyncFunction("isSignedIn") { promise: Promise ->
            val account = GoogleSignIn.getLastSignedInAccount(appContext.reactContext!!)
            promise.resolve(account != null)
        }
    }

    companion object {
        private const val RC_SIGN_IN = 9001
    }
}
